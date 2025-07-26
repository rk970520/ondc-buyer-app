 How to Use This Backend
Run the Server:
Ensure all files are in place.
Run npm install.
Start the server with npm start.
API Flow (How your frontend would interact):
Search: POST /client/v1/search with { "searchTerm": "tomato" }. Get back a { "transactionId": "..." }.
Poll for Results: GET /client/v1/search/results/:transactionId. Keep calling this until you get items.
Select Items: POST /client/v1/select with { "transactionId": "...", "providerId": "...", "itemIds": ["...", "..."] }.
Poll for Quote: GET /client/v1/transaction/:transactionId. Keep calling until status is QUOTE_RECEIVED and the quote object is populated.
Initialize Order: POST /client/v1/init with { "transactionId": "...", "billingDetails": {...}, "deliveryDetails": {...} }.
Poll for Init Details: GET /client/v1/transaction/:transactionId. Keep calling until status is INIT_DETAILS_RECEIVED.
Confirm Order: POST /client/v1/confirm with { "transactionId": "..." }.
Poll for Confirmation: GET /client/v1/transaction/:transactionId. Keep calling until status is ORDER_CONFIRMED.
Check Status: POST /client/v1/status with { "transactionId": "..." }. The updated status will be reflected in the transaction details endpoint.