Library API Design

A REST API for a library's books resource. All requests and responses use JSON.

Base path: /books

    Book object

    {
    "id": 1,
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1958,
    "isbn": "9780385474542"
    }

Endpoints
1. List all books
    Method: GET
    Path: /books
    Description: Returns every book in the library.
    Request body: none
    Success status: 200 OK

2. Get one book
    Method: GET
    Path: /books/{id}
    Description: Returns the book with the given id.
    Request body: none
    Success status: 200 OK

3. Create a book
    Method: POST
    Path: /books
    Description: Adds a new book to the library.

Example request body:

    {
    "title": "Weep Not, Child",
    "author": "Ngugi wa Thiong'o",
    "year": 1964,
    "isbn": "9780435908300"
    }

4. Update a book
    Method: PUT
    Path: /books/{id}
    Description: Replaces the details of an existing book.

Example request body:


{
  "title": "Weep Not, Child",
  "author": "Ngugi wa Thiong'o",
  "year": 1964,
  "isbn": "9780435908301"
}

5. Delete a book
    Method: DELETE
    Path: /books/{id}
    Description: Removes the book with the given id.
    Request body: none
    Success status: 204 No Content


6. List books by an author
    Method: GET
    Path: /books?author={name} (for example /books?author=Chinua%20Achebe)
    Description: Returns only the books written by the given author, using a query parameter.
    Request body: none
    Success status: 200 OK

Error codes
    400 Bad Request
    Meaning: The request is invalid, for example required fields are missing or have the wrong type.
    Example: POST /books with a body that has no title

{ "error": "title is required" }


404 Not Found
    Meaning: The requested book does not exist.
    Example: GET /books/9999 when no book has the id 9999.

{ "error": "Book not found" }