# SnapShare Scaling Plan

SnapShare is a photo-sharing app where users upload photos and scroll a feed of photos from the people they follow.

## 1. Assumptions

Starting facts given:

- 10 million registered users
- 10% of them are active each day
- Each active user uploads 1 photo per day
- Each active user views 50 feed pages per day
- An average photo is 2 MB, and each photo also gets a 50 KB thumbnail

Extra assumptions I made to do the maths:

- A day has 86,400 seconds, and traffic is spread evenly to get the average
- Peak traffic is 5 times the average
- Each feed page view is one request to the system
- 1 TB = 1,000,000 MB
- Storage counts only the original photo and its thumbnail (no backups or copies)

Daily active users (DAU) = 10,000,000 x 10% = **1,000,000 users per day**.

## 2. Estimates

**Uploads per second**

- Uploads per day = 1,000,000 users x 1 photo = 1,000,000 photos
- Average = 1,000,000 / 86,400 = about **12 uploads per second**
- Peak = 5 x 11.6 = about **58 uploads per second**

**Feed views per second**

- Feed views per day = 1,000,000 users x 50 = 50,000,000 views
- Average = 50,000,000 / 86,400 = about **579 views per second**
- Peak = 5 x 579 = about **2,900 views per second**

**Storage per year**

- Per photo = 2 MB original + 0.05 MB thumbnail = 2.05 MB
- Per day = 1,000,000 x 2.05 MB = 2,050,000 MB = about 2.05 TB
- Per year = 2.05 TB x 365 = about **748 TB** (roughly 0.75 PB)
- Of this, originals are 730 TB and thumbnails are 18.25 TB

## 3. Read-heavy or write-heavy?

SnapShare is **read-heavy**. There are 50 million feed views for every 1 million uploads, so reads outnumber writes about 50 to 1. This means the design should focus on making reads cheap and fast: caching, a CDN and a database read replica. Writes still matter (they are large files), but they are rare enough that they can be handled in the background where possible.

## 4. Why photos do not go in the database

Photos should not be stored inside the database. At about 748 TB per year, the files would make the database huge, slow to back up and slow to query, and database storage is much more expensive than file storage. A database is also not built to serve large files to millions of viewers.

Photos go in **object storage** instead. It is cheap, durable, scales to very large sizes, and works well with a CDN. The database only stores small **metadata**: the photo id, owner, caption, timestamps and the URLs of the original and the thumbnail.

## 5. Architecture diagram

```
                          +----------------+
                          |     Client     |
                          | (mobile / web) |
                          +--------+-------+
                                   |
              +--------------------+--------------------+
              | photos and thumbnails                   | API requests
              v                                         v
      +---------------+                        +----------------+
      |      CDN      |                        | Load Balancer  |
      +-------+-------+                        +--------+-------+
              | (cache miss)                            |
              v                                +--------+--------+
      +----------------+                       v                 v
      | Object Storage |                +------------+   +------------+
      | (photo files)  |<---------------| App Server |   | App Server |
      +-------+--------+   save photo   +-----+------+   +-----+------+
              ^                               |                |
              |                               +-------+--------+
              |                                       |
              |                  +--------------------+-------------------+
              |                  |                    |                   |
              |                  v                    v                   v
              |            +-----------+     +------------------+   +-------------+
              |            |   Cache   |     |   Primary DB     |   |    Queue    |
              |            |  (Redis)  |     |  (writes)        |   | (thumbnail  |
              |            +-----------+     +--------+---------+   |    jobs)    |
              |                                       |             +------+------+
              |                                       | replicates         |
              |                                       v                    v
              |                              +------------------+   +-------------+
              |                              |   Read Replica   |   |   Worker    |
              |                              |  (feed reads)    |   | (creates    |
              |                              +------------------+   | thumbnails) |
              |                                                     +------+------+
              |                                                            |
              +------------------------------------------------------------+
                                  worker saves thumbnail
```

## 6. What each component does

- **CDN:** Serves photos and thumbnails from servers close to the user, so images load fast and the main system is not hit for every image.
- **Load balancer:** Spreads incoming requests across several app servers so that no single server is overloaded and one failure does not stop the app.
- **App servers:** Run the application logic (login, upload, building the feed) and can be added or removed as traffic changes.
- **Cache:** Keeps frequently requested data, such as popular feeds, in memory so that repeated reads do not hit the database.
- **Primary database:** Stores all metadata and handles every write, such as new photos, follows and likes.
- **Read replica:** A copy of the primary database that serves feed reads, which takes the heavy read load off the primary.
- **Object storage:** Holds the actual photo and thumbnail files cheaply and durably at very large scale.
- **Queue:** Holds thumbnail jobs so the upload does not have to wait for the thumbnail to be created.
- **Worker:** Takes jobs from the queue, creates the 50 KB thumbnail and saves it, so slow work is done in the background.

## 7. Upload flow, step by step

1. The user picks a photo in the app and the client sends it to SnapShare.
2. The load balancer sends the request to one of the app servers.
3. The app server checks that the user is logged in and that the file is a valid image of an allowed size.
4. The app server saves the original photo in object storage.
5. The app server writes a metadata record (photo id, owner, original URL, thumbnail marked as pending) to the primary database.
6. The app server puts a "create thumbnail" job on the queue.
7. The app server replies "upload successful" to the user. The user does not wait for the thumbnail.
8. A worker takes the job from the queue, downloads the original, creates the 50 KB thumbnail and saves it in object storage.
9. The worker updates the database record with the thumbnail URL, and the related cached feeds are cleared so they are rebuilt with the new photo.
10. When followers open their feeds, the thumbnails and photos are served through the CDN.

## 8. Trade-offs

- **Background thumbnails (queue) vs instant thumbnails:** Using a queue makes uploads fast and lets the system absorb spikes, but the thumbnail may appear a few seconds late, so the app must show a placeholder until it is ready. It also adds another part (the queue and workers) to run and monitor.
- **Caching vs fresh data:** The cache makes feeds fast and protects the database, but cached feeds can be slightly out of date, and deciding when to clear the cache is hard to get right.
- **Read replica vs consistency:** A read replica lets the system handle many more feed reads, but replication takes a short time, so a user may briefly not see a photo they just uploaded if their feed is read from the replica.
- **Many components vs simplicity:** A CDN, cache, queue and replica make the system fast and scalable, but each one adds cost and more things that can fail, which is more than a small app with few users needs. For 1 million daily users the extra complexity is worth it.