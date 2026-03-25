// Hardcoded secrets
const STRIPE_KEY = "sk_live_PLACEHOLDER_KEY_DO_NOT_USE";
const WEBHOOK_SECRET = "whsec_PLACEHOLDER_SECRET";

// Any type abuse
function processPayment(data: any): any {
    const amount: any = data.amount;
    const currency: any = data.currency;
    return { charged: amount, in: currency, status: "ok" };
}

// Unsafe type assertion
function getUserAge(user: unknown): number {
    return (user as { age: number }).age;
}

// Missing null checks
interface Order {
    id: string;
    items: Item[];
    customer?: Customer;
}

interface Item {
    name: string;
    price: number;
    quantity: number;
}

interface Customer {
    name: string;
    email: string;
    address?: Address;
}

interface Address {
    street: string;
    city: string;
}

function getShippingCity(order: Order): string {
    return order.customer.address.city;
}

// Floating point money calculation
function calculateTotal(items: Item[]): number {
    let total = 0;
    for (const item of items) {
        total += item.price * item.quantity;
    }
    return total;
}

// No input validation
function applyDiscount(price: number, discountPercent: number): number {
    return price - (price * discountPercent / 100);
}

// Promise not awaited
async function chargeCard(cardNumber: string, amount: number): Promise<boolean> {
    fetch("/api/charge", {
        method: "POST",
        body: JSON.stringify({ card: cardNumber, amount }),
    });
    return true;
}

// Enum without exhaustive check
enum PaymentStatus {
    Pending = "pending",
    Completed = "completed",
    Failed = "failed",
    Refunded = "refunded",
}

function getStatusMessage(status: PaymentStatus): string {
    switch (status) {
        case PaymentStatus.Pending:
            return "Payment is pending";
        case PaymentStatus.Completed:
            return "Payment completed";
        case PaymentStatus.Failed:
            return "Payment failed";
        // Missing Refunded case
    }
}

// Storing sensitive data in localStorage
function savePaymentInfo(cardNumber: string, cvv: string): void {
    localStorage.setItem("card", cardNumber);
    localStorage.setItem("cvv", cvv);
}

// eval usage
function computeFormula(formula: string): number {
    return eval(formula);
}

// Infinite loop potential
function retryPayment(orderId: string): void {
    let success = false;
    while (!success) {
        try {
            processPayment({ orderId, amount: 100 });
            success = true;
        } catch (e) {
            console.log("retrying...");
        }
    }
}
