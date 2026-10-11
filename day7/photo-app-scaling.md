# SnapShare Scaling Plan

SnapShare is a photo-sharing app where users upload photos and scroll a feed of photos from the people they follow.

## 1. Assumptions

Starting facts given:

- 10 million registered users
- 10% of them are active each day
- Each active user uploads 1 photo per day and views 50 feed pages per day
- An average photo is 2 MB, and each photo also gets a 50 KB thumbnail

Extra assumptions I made to do the maths:

- A day has 86,400 seconds, and traffic is spread evenly to get the average
- Peak traffic is 5 times the average
- Each feed page view is one request to the system
- 1 TB = 1,000,000 MB
- Storage counts the original and the thumbnail only (no backups or copies)
- Each photo has about 1 KB of metadata in the database

Daily active users (DAU) = 10,000,000 x 10% = **1,000,000 users per day**.

## 2. Estimates

| Metric | Working | Average | Peak (5x) |
|---|---|---|---|
| Uploads per second | 1,000,000 / 86,400 | about 12 | about 58 |
| Feed views per second | 50,000,000 / 86,400 | about 579 | about 2,900 |
| Upload bandwidth | uploads/s x 2 MB | about 24 MB/s | about 116 MB/s |

**Storage per year**

- Per photo = 2 MB original + 0.05 MB thumbnail = 2.05 MB
- Per day = 1,000,000 x 2.05 MB = 2,050,000 MB = about 2.05 TB
- Per year = 2.05 TB x 365 = about **748 TB** (roughly 0.75 PB)
- Originals are about 730 TB and thumbnails about 18.25 TB
- Metadata is only about 1 GB per day (about 365 GB per year), so the photos, not the database rows, are what make storage big

## 3. Read-heavy or write-heavy?

SnapShare is **read-heavy**. There are 50 million feed views for every 1 million uploads, so reads outnumber writes about 50 to 1 (and each feed page shows many photos, so the real read load is even higher).

What this means for the design:

- Make reads cheap: a CDN for images, a cache for hot data, and a read replica for feed queries.
- Writes (about 58 per second at peak) are few, but each one is a large file, so the file should go straight to object storage and slow work (thumbnails) should happen in the background.

## 4. Why photos do not go in the database

At about 748 TB per year, photos would make the database huge, slow to back up and slow to query, and database storage costs much more than file storage. A database is also not built to serve large files to millions of viewers.

Photos go in **object storage** instead. It is cheap, durable, scales to very large sizes and works well with a CDN. The database stores only small **metadata**: photo id, owner, caption, timestamps, status and the paths of the original and the thumbnail.

## 5. Architecture diagram

```
 Client (mobile / web)
   |            |                    \
   | images     | API requests        \ direct upload (presigned URL)
   v            v                      \
  CDN      Load Balancer                \
   |            |                        \
   | miss       v                         \
   |     App Servers ---------------------> v
   |        |   |   \                +----------------+
   |        |   |    \               | Object Storage |<------+
   |        |   |     \              | (photos +      |       |
   +--------|---|------|------------>|  thumbnails)   |       |
            |   |      |             +----------------+       |
            |   |      v                                      |
            |   |   +-------+     +----------+     +--------+ |
            |   |   | Queue |---->| Worker   |-----+        | |
            |   |   +-------+     +----+-----+  saves        | |
            |   v                      |        thumbnail ----+
            | +---------+              | updates status
            | |  Cache  |              v
            | | (Redis) |        +------------+  replicates  +--------------+
            | +---------+        | Primary DB |------------->| Read Replica |
            |                    | (writes)   |              | (feed reads) |
            +------------------->+------------+              +--------------+
                                                                  ^
                                          feed reads -------------+
```

## 6. What each component does

- **CDN:** Serves photos and thumbnails from servers close to the user, so images load fast and the main system is not hit for every image.
- **Load balancer:** Spreads requests across several app servers so no single server is overloaded and one failure does not stop the app.
- **App servers:** Run the application logic (login, upload permissions, building the feed) and can be added or removed as traffic changes.
- **Cache (Redis):** Keeps frequently requested data, such as popular feeds, in memory so repeated reads do not hit the database.
- **Primary database:** Stores all metadata and handles every write, such as new photos, follows and likes.
- **Read replica:** A copy of the primary that serves feed reads, taking the heavy read load off the primary.
- **Object storage:** Holds the actual photo and thumbnail files cheaply and durably at very large scale.
- **Queue:** Holds thumbnail jobs so the upload does not have to wait for the thumbnail to be created.
- **Worker:** Takes jobs from the queue, creates the 50 KB thumbnail and saves it, so slow work is done in the background.

## 7. Upload flow, step by step

1. The user picks a photo and the client asks an app server (through the load balancer) to upload it.
2. The app server checks that the user is logged in and that the file type and size are allowed.
3. The app server writes a metadata record to the primary database with status `processing`, and returns a **presigned URL**, a temporary secure link to object storage.
4. The client uploads the 2 MB photo **directly to object storage** using that URL. The file never passes through the app servers, which keeps them free for other requests.
5. The client tells the app server the upload finished. The app server puts a "create thumbnail" job (photo id and path) on the **queue** and replies "upload successful". The user does not wait for the thumbnail.
6. A **worker** takes the job from the queue, downloads the original from object storage, creates the 50 KB thumbnail and saves it back to object storage.
7. The worker updates the database record: status becomes `ready` and the thumbnail path is stored.
8. The related cached feeds are cleared so they are rebuilt with the new photo.
9. When followers open their feeds, thumbnails and photos are served through the **CDN**.

If a worker crashes, the job is not lost: it returns to the queue and is retried. Jobs that keep failing go to a separate "failed jobs" list for investigation, so one bad photo never blocks the others.

## 8. Trade-offs

- **Background thumbnails (queue) vs instant thumbnails:** The queue makes uploads fast and absorbs spikes, but the thumbnail appears a few seconds late, so the app shows a placeholder until the status is `ready`. It also adds parts (queue and workers) to run and monitor.
- **Read replica vs consistency:** Replicas let the system handle many more feed reads, but replication takes a short time. The system is **eventually consistent**: a user may briefly not see a photo they just uploaded if their feed comes from the replica. To reduce this, a user's own profile and just-uploaded photos can be read from the primary or the cache for a short time after uploading.
- **Caching vs fresh data:** The cache makes feeds fast and protects the database, but cached feeds can be slightly out of date, and deciding when to clear the cache is hard to get right. For a photo feed, a delay of a few seconds is acceptable.
- **Direct upload vs uploading through the app server:** Presigned direct uploads keep heavy files off the app servers and scale easily, but they add complexity: an extra confirmation step, leftover files from uploads that never finish, and checks (file type, malware) that must happen afterwards in the worker.
- **Many components vs simplicity:** A CDN, cache, queue and replica make the system fast and scalable, but each one adds cost and more things that can fail, which is more than a small app needs. For 1 million daily users the extra complexity is worth it.