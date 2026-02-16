# API Reference

This document provides a comprehensive reference for the application's API endpoints.

## Overview

- **Base URL**: `/api` (Internal), `/api/v1/gateway` (Public/Obfuscated)
- **Authentication**: Most endpoints require a valid Firebase Auth token.
  - **Header**: `Authorization: Bearer <token>`
- **Response Format**: JSON
- **Error Format**: `{ "error": "Error message" }`

### API Gateway (Obfuscation)

In production, all API calls should route through the gateway to hide the internal directory structure.

- **Endpoint**: `POST /api/v1/gateway`
- **Headers**:
  - `X-Api-Target`: The actual internal path (e.g., `/api/groups/123`)
  - `Authorization`: Bearer token
- **Body**: The body intended for the target endpoint.

---

## 1. Groups API

### List User's Groups

- **Method**: `GET`
- **Path**: `/api/groups`
- **Response**: `{ "groups": [GroupObject] }`

### Create Group

- **Method**: `POST`
- **Path**: `/api/groups`
- **Body**:
  ```json
  {
    "name": "string (min 5 chars)",
    "colorScheme": "string (optional, default: orange)",
    "emoji": "string (optional)"
  }
  ```
- **Response**: `{ "group": GroupObject }`

### Join Group

- **Method**: `POST`
- **Path**: `/api/groups/join`
- **Body**: `{ "groupCode": "string" }`
- **Response**: `{ "group": GroupObject }`

### Validate Group Code

- **Method**: `POST`
- **Path**: `/api/groups/validate-code`
- **Body**: `{ "code": "string" }`
- **Response**: `{ "groupId": "string", "groupName": "string", "code": "string" }`

### Get Group Details

- **Method**: `GET`
- **Path**: `/api/groups/[groupId]`
- **Response**: `{ "group": GroupObject }`

### Update Group

- **Method**: `PATCH`
- **Path**: `/api/groups/[groupId]`
- **Body**: `{ "name": "string?", "colorScheme": "string?", "emoji": "string?" }`
- **Response**: `{ "group": GroupObject }`

### Delete Group

- **Method**: `DELETE`
- **Path**: `/api/groups/[groupId]`
- **Response**: `{ "message": "Group deleted successfully" }`

### Leave Group

- **Method**: `POST`
- **Path**: `/api/groups/[groupId]/leave`
- **Response**: `{ "message": "Successfully left group" }`

### Guest Group Access

- **Method**: `GET`
- **Path**: `/api/groups/[groupId]/guest`
- **Headers**: Requires guest context (implementation detail: likely specific headers/cookies handled by `withOptionalAuth`)
- **Response**: `{ "group": GroupObject }`

---

## 2. Trips API

### Create Trip

- **Method**: `POST`
- **Path**: `/api/groups/[groupId]/trips`
- **Body**:
  ```json
  {
    "tripName": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "location": "string (optional)",
    "status": "planning" | "finalized" | "ongoing" | "cancelled"
  }
  ```
- **Response**: `{ "trip": TripObject }`

### Update Trip

- **Method**: `PATCH`
- **Path**: `/api/groups/[groupId]/trips/[tripId]`
- **Body**: Same as Create Trip, fields optional.
- **Response**: `{ "trip": TripObject }`

### Delete Trip

- **Method**: `DELETE`
- **Path**: `/api/groups/[groupId]/trips/[tripId]`
- **Response**: `{ "message": "Trip deleted successfully" }`

### Export Trip to ICS

- **Method**: `GET`
- **Path**: `/api/trips/[tripId]/export/ics`
- **Response**: `.ics` file download

---

## 3. Activities API

### Create Activity

- **Method**: `POST`
- **Path**: `/api/trips/[tripId]/activities`
- **Body**:
  ```json
  {
    "title": "string",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM (optional)",
    "endTime": "HH:MM (optional)",
    "notes": "string (optional)",
    "transportationMode": "string (optional)",
    "pickupTime": "string (optional)",
    "pickupLocation": "string (optional)",
    "dropoffLocation": "string (optional)"
  }
  ```
- **Response**: `{ "activity": ActivityObject }`

### Update Activity

- **Method**: `PATCH`
- **Path**: `/api/trips/[tripId]/activities/[activityId]`
- **Body**: Same as Create Activity, fields optional + `done: boolean`.
- **Response**: `{ "activity": ActivityObject }`

### Delete Activity

- **Method**: `DELETE`
- **Path**: `/api/trips/[tripId]/activities/[activityId]`
- **Response**: `{ "message": "Activity deleted successfully" }`

---

## 4. Budgets & Expenses API

### List Budgets

- **Method**: `GET`
- **Path**: `/api/trips/[tripId]/budgets`
- **Response**: `{ "budgets": [BudgetObject] }`

### Create Budget

- **Method**: `POST`
- **Path**: `/api/trips/[tripId]/budgets`
- **Body**:
  ```json
  {
    "amount": number,
    "description": "string (optional)",
    "category": "string (optional)",
    "activityId": "string (optional)",
    "isBooked": boolean (optional)
  }
  ```
- **Response**: `{ "budget": BudgetObject }`

### Update Budget

- **Method**: `PUT`
- **Path**: `/api/trips/[tripId]/budgets/[budgetId]`
- **Body**: properties to update
- **Response**: `{ "budget": BudgetObject }`

### Delete Budget

- **Method**: `DELETE`
- **Path**: `/api/trips/[tripId]/budgets/[budgetId]`
- **Response**: `{ "success": true }`

### List Expenses

- **Method**: `GET`
- **Path**: `/api/trips/[tripId]/expenses`
- **Response**: `{ "expenses": [ExpenseObject] }`

### Create Expense

- **Method**: `POST`
- **Path**: `/api/trips/[tripId]/expenses`
- **Body**:
  ```json
  {
    "paidBy": "userId or email",
    "amount": number,
    "description": "string",
    "date": "YYYY-MM-DD",
    "category": "string",
    "splitWith": ["userId1", "userId2"],
    "paymentMethod": "enum",
    "accountNumber": "string",
    "bankName": "string",
    "qrImage": "string (url)"
  }
  ```
- **Response**: `{ "expense": ExpenseObject }`

### Update Expense

- **Method**: `PATCH`
- **Path**: `/api/trips/[tripId]/expenses/[expenseId]`
- **Body**: expense fields
- **Response**: `{ "expense": ExpenseObject }`

### Mark Expense as Paid (Legacy/Alternative)

- **Method**: `POST`
- **Path**: `/api/trips/[tripId]/expenses/[expenseId]/payments`
- **Body**: `{ "memberEmail": "string", "isPaid": boolean, "createPaymentLog": boolean }`
- **Response**: `{ "expense": ExpenseObject }`

### Confirm Payment

- **Method**: `POST`
- **Path**: `/api/trips/[tripId]/expenses/[expenseId]/payments/confirm` (or `/confirm-payment`)
- **Body**: `{ "memberEmail": "string", "status": "confirmed" | "rejected" }`
- **Response**: `{ "expense": ExpenseObject }`

### List Payment Logs

- **Method**: `GET`
- **Path**: `/api/trips/[tripId]/payment-logs`
- **Response**: `{ "paymentLogs": [PaymentLogObject] }`

### Create Payment Log

- **Method**: `POST`
- **Path**: `/api/trips/[tripId]/payment-logs`
- **Body**: `{ "expenseId", "payerEmail", "payeeEmail", "amount", "paymentMethod" }`
- **Response**: `{ "paymentLog": PaymentLogObject }`

---

## 5. User & Profile API

### Get Profile (Sync)

- **Method**: `GET`
- **Path**: `/api/profile`
- **Response**: `{ "user": UserObject }`

### Update Profile

- **Method**: `PATCH`
- **Path**: `/api/profile`
- **Body**: `{ "name": "string", "photoURL": "string", "bio": "string", "travelStyle": "string" }`
- **Response**: `{ "message": "Success", "user": UserObject }`

### Update Profile (User internal)

- **Method**: `PATCH`
- **Path**: `/api/user/profile`
- **Description**: Updates specific user fields like `lastSeenWhatsNew`
- **Body**: `{ "lastSeenWhatsNew": "version", ...otherFields }`

### Update Password

- **Method**: `PATCH`
- **Path**: `/api/profile/password`
- **Body**: `{ "currentPassword": "string", "newPassword": "string" }`

### Sync User

- **Method**: `POST` / `GET`
- **Path**: `/api/sync`
- **Description**: Force sync Firebase user to Database.

---

## 6. Notifications API

### List Notifications

- **Method**: `GET`
- **Path**: `/api/notifications`
- **Query Params**: `limit`, `offset`, `read=true/false`
- **Response**: `{ "notifications": [], "total": number, ... }`

### Create Notification (Internal)

- **Method**: `POST`
- **Path**: `/api/notifications`
- **Body**: `{ "userId", "type", "title", "message", ...relatedIds }`

### Mark Notification Read

- **Method**: `POST`
- **Path**: `/api/notifications/[id]/read`
- **Response**: `{ "notification": NotificationObject }`

### Mark All Read

- **Method**: `POST`
- **Path**: `/api/notifications/read-all`
- **Response**: `{ "count": number }`

### Get Unread Count

- **Method**: `GET`
- **Path**: `/api/notifications/unread-count`
- **Response**: `{ "count": number }`

---

## 7. Utils & Configuration

### What's New Config

- **Method**: `GET`
- **Path**: `/api/config/whats-new`
- **Response**: `{ "version": "string", "features": [] }`

### Update What's New (Admin)

- **Method**: `POST`
- **Path**: `/api/config/whats-new`
- **Headers**: `x-admin-password: ...`
- **Body**: `{ "version": "string", "features": [] }`

### Upload Image

- **Method**: `POST`
- **Path**: `/api/upload/image`
- **Body**: FormData with `file` and `folder`
- **Response**: `{ "url": "string", "publicId": "string" }`

### Get User Count

- **Method**: `GET`
- **Path**: `/api/stats/user-count`
- **Response**: `{ "count": number }`

### Reviews

- **Method**: `GET`
- **Path**: `/api/reviews`
- **Query Params**: `page`, `limit`, `rating`
- **Method**: `POST`
- **Path**: `/api/reviews` (Rate Limited)
- **Body**: `{ "rating", "comment", "name", "email" }`
