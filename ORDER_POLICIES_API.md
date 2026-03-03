# OrderPolicies API Documentation

## Overview
The OrderPolicies module provides functionality to manage HTML policy content for each polling order. This allows administrators to store and manage policy documents that are specific to each polling order.

## Database Schema

### OrderPolicies Table
```sql
CREATE TABLE public."OrderPolicies" (
    order_policy_id integer NOT NULL,
    polling_order_id integer NOT NULL,
    polling_order_policy text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- Primary key: `order_policy_id` (auto-increment)
- Foreign key: `polling_order_id` references `PollingOrder.polling_order_id`
- Unique constraint: Only one policy per polling order
- Automatic timestamps for created_at and updated_at
- Cascade delete when polling order is deleted

## API Endpoints

All endpoints require JWT authentication via the `Authorization` header.

### 1. Create Order Policy
**POST** `/order-policies`

Creates a new policy for a polling order. Only polling order administrators can create policies.

**Request Body:**
```json
{
  "polling_order_id": 1,
  "polling_order_policy": "<h2>Polling Order Policy</h2><p>This is the policy content...</p>",
  "authToken": "your-jwt-token"
}
```

**Response:**
```json
{
  "order_policy_id": 1,
  "polling_order_id": 1,
  "polling_order_policy": "<h2>Polling Order Policy</h2><p>This is the policy content...</p>",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 2. Get Order Policy by Polling Order ID
**GET** `/order-policies/polling-order/{pollingOrderId}`

Retrieves the policy for a specific polling order. Users can only view policies for their own polling order.

**Response:**
```json
{
  "order_policy_id": 1,
  "polling_order_id": 1,
  "polling_order_policy": "<h2>Polling Order Policy</h2><p>This is the policy content...</p>",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Note:** Returns `null` if no policy exists for the polling order.

### 3. Update Order Policy
**PUT** `/order-policies/{id}`

Updates an existing order policy. Only polling order administrators can update policies.

**Request Body:**
```json
{
  "polling_order_policy": "<h2>Updated Policy</h2><p>Updated policy content...</p>",
  "authToken": "your-jwt-token"
}
```

**Response:**
```json
{
  "order_policy_id": 1,
  "polling_order_id": 1,
  "polling_order_policy": "<h2>Updated Policy</h2><p>Updated policy content...</p>",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:45:00Z"
}
```

### 4. Delete Order Policy
**DELETE** `/order-policies/{id}`

Deletes an order policy. Only polling order administrators can delete policies.

**Response:**
```json
{
  "message": "Order policy deleted successfully"
}
```

### 5. Get All Order Policies (Admin Only)
**GET** `/order-policies`

Retrieves all order policies for the user's polling order. Only polling order administrators can access this endpoint.

**Response:**
```json
[
  {
    "order_policy_id": 1,
    "polling_order_id": 1,
    "polling_order_policy": "<h2>Policy 1</h2><p>Content...</p>",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  {
    "order_policy_id": 2,
    "polling_order_id": 2,
    "polling_order_policy": "<h2>Policy 2</h2><p>Content...</p>",
    "created_at": "2024-01-16T09:15:00Z",
    "updated_at": "2024-01-16T09:15:00Z"
  }
]
```

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Only polling order administrators can create policies",
  "error": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "A policy already exists for this polling order. Use update instead.",
  "error": "Bad Request"
}
```

### 401 Unauthorized (Cross-Polling Order Access)
```json
{
  "statusCode": 401,
  "message": "You can only view policies for your own polling order",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Order policy not found",
  "error": "Not Found"
}
```

## Installation Instructions

### 1. Run the Database Script
Execute the `create_order_policies_table.sql` script in your PostgreSQL database:

```bash
psql -d your_database_name -f create_order_policies_table.sql
```

### 2. Restart the Application
The new module is already integrated into the application. Simply restart your NestJS application:

```bash
npm run start:dev
```

## Usage Examples

### Creating a Policy
```javascript
const response = await fetch('/order-policies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    polling_order_id: 1,
    polling_order_policy: '<h2>Voting Guidelines</h2><p>Please follow these guidelines when voting...</p>',
    authToken: 'your-jwt-token'
  })
});
```

### Retrieving a Policy
```javascript
const response = await fetch('/order-policies/polling-order/1', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
const policy = await response.json();
```

## Security Features

- **JWT authentication required** for all endpoints
- **Role-based authorization**: Only polling order administrators (admin or admin assistant) can create, update, or delete policies
- **Polling order isolation**: Users can only manage and view policies for their own polling order
- **Members can view policies** for their own polling order only
- **Proper error handling** and validation
- **Policies are automatically deleted** when their associated polling order is deleted (cascade delete)

## HTML Content Guidelines

The `polling_order_policy` field accepts HTML content. Consider these guidelines:

- Use semantic HTML tags (`<h1>`, `<h2>`, `<p>`, `<ul>`, `<ol>`, etc.)
- Avoid inline styles; use CSS classes instead
- Ensure content is accessible and follows web standards
- Sanitize HTML content on the frontend to prevent XSS attacks
- Consider using a rich text editor for content creation
