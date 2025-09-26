# Application Flow Diagram

This document outlines the user and data flow for the Thirumalai Maligai application.

## Mermaid Diagram

You can copy the code below and paste it into a Mermaid live editor (like [mermaid.live](https://mermaid.live)) to visualize the diagram.

```mermaid
graph TD
    subgraph "User Authentication"
        A[User visits Landing Page] --> B{Login or Register};
        B -- Login --> C[Enters Credentials];
        B -- Register --> D[Enters Details];
        C --> E{Authentication Check};
        D --> E;
        E -- Admin Credentials --> F[Admin Dashboard];
        E -- Customer Credentials --> G[Products Page];
        E -- Invalid --> B;
    end

    subgraph "Customer Journey"
        G --> H[Browse Products];
        H --> I[Add Product to Cart];
        I --> J[View Cart];
        J --> K[Proceed to Checkout];
        K --> L[Place Order (Cash on Delivery)];
        L --> M[Checkout Success Page];
        M --> G;
    end

    subgraph "Admin Journey"
        F --> N[View Dashboard];
        F --> O[Manage Products];
        F --> P[Point of Sale (POS)];

        subgraph "Product Management"
            O --> Q[View Products List];
            Q --> R[Add New Product];
            Q --> S[Edit Existing Product];
            Q --> T[Delete Product];
            R --> U[Product Form];
            S --> U;
            U -- Save --> Q;
            T -- Confirm --> Q;
        end

        subgraph "Point of Sale (POS)"
            P --> V[Scan Barcode];
            V --> W{API: Get Product by Barcode};
            W -- Single Product Found --> X[Add Product to Sale];
            W -- Multiple Products Found --> Y[Show Selection Dialog];
            W -- Not Found --> Z[Show 'Not Found' Toast];
            Y -- User Selects Product --> X;
            X --> P;
        end
    end

```

## Flow Descriptions

### 1. Authentication
- **Landing/Login:** All users start at the login page. They can choose to log in or navigate to the registration page.
- **Roles:** The system distinguishes between two main roles based on credentials:
  - **Admin:** Redirected to the Admin Dashboard.
  - **Customer:** Redirected to the main product browsing page.

### 2. Customer Journey
- **Browse:** Customers can view all available products.
- **Cart:** They can add items to their shopping cart. The cart can be viewed, and quantities can be adjusted.
- **Checkout:** The checkout process simulates a "Cash on Delivery" order. After placing an order, the user is shown a success page and can continue shopping.

### 3. Admin Journey
- **Dashboard:** Admins can view a summary of sales, orders, and product counts.
- **Product Management (CRUD):**
  - Admins have full Create, Read, Update, and Delete capabilities for all products in the catalog.
  - Adding or editing a product uses a single, shared form.
  - Deleting a product requires a confirmation step.
- **Point of Sale (POS):**
  - Admins can use the POS interface to simulate a checkout process using a barcode scanner.
  - **Scanning:** The system calls a backend API to find products by barcode.
  - **Results:**
    - If one product is found, it's added directly to the sale.
    - If multiple products are found (e.g., same product with different expiry dates), a dialog appears for the admin to select the correct one.
    - If no product is found, a notification is shown.
  - **Completion:** The sale is finalized, and the system is ready for the next transaction.
