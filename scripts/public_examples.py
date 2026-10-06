"""Publication boundary: remove private project evidence before any JSON is made.
The local source notes are not publication assets. Examples below are fictional.
"""
import re
import hashlib
import json
from pathlib import Path

_PRIVATE_MARKERS = set(json.loads(Path(__file__).with_name("private-markers.json").read_text()))

def has_private_marker(text):
    return any(hashlib.sha256(token.lower().encode()).hexdigest() in _PRIVATE_MARKERS
               for token in re.findall(r"[A-Za-z][A-Za-z0-9_-]*", text))

EXAMPLES = {
'y26-projects': '''**Fictional learning context**

The allocation team owns a sample inventory reservation service. The outbound team owns a sample order delivery service. These labels describe teaching roles only, not a real organization or its systems.

Example flow: client → API gateway → order service → inventory service → database. An order event can feed a separate reporting service. Discuss ownership, transactions, idempotency, and failure handling without disclosing internal architecture.

All service names, schemas, values, and configurations in this public edition are generic teaching examples, not production evidence.''',
'y26-1.47': '''**Fictional example: a product catalog**

```java
@Entity
@Table(name = "products")
class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private BigDecimal price;
    // Getters and setters omitted.
}
interface ProductRepository extends JpaRepository<Product, Long> {}
record ProductRequest(@NotBlank String name,
                      @NotNull @DecimalMin("0.00") BigDecimal price) {}
record ProductResponse(Long id, String name, BigDecimal price) {}

@Service
@RequiredArgsConstructor
class ProductService {
    private final ProductRepository repository;
    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = new Product();
        product.setName(request.name());
        product.setPrice(request.price());
        Product saved = repository.save(product);
        return new ProductResponse(saved.getId(), saved.getName(), saved.getPrice());
    }
}

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
class ProductController {
    private final ProductService service;
    @PostMapping
    ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse saved = service.create(request);
        return ResponseEntity.created(URI.create("/api/products/" + saved.id()))
            .body(saved);
    }
}
```

Complete the exercise with GET (including pagination), PUT, and DELETE operations. Return 404 for missing products and map validation/conflict errors consistently. Keep transaction boundaries in the service and enforce uniqueness in the database. Imports, accessors, and error handlers are omitted from this teaching sketch.''',
'y26-1.48': '''**Fictional example: customers and orders**

```java
@Entity
class Customer {
    @Id @GeneratedValue Long id;
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL,
               orphanRemoval = true)
    List<PurchaseOrder> orders = new ArrayList<>();
    void addOrder(PurchaseOrder order) {
        orders.add(order);
        order.customer = this;
    }
}
@Entity
@Table(name = "purchase_orders")
class PurchaseOrder {
    @Id @GeneratedValue Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    Customer customer;
}
```

The order owns the foreign key; `mappedBy` identifies the inverse side. Keep both sides consistent. Cascade and orphan removal are lifecycle choices, not fetch strategies. For a many-to-many example, use students, courses, and an Enrollment entity when the association has a grade or enrollment date. These entities are fictional.''',
'y26-2.23': '''**Fictional data: a small product catalog**

```java
record Product(String name, String category, int priceCents) {}
List<Product> products = List.of(
    new Product("Notebook", "Stationery", 500),
    new Product("Pen", "Stationery", 200),
    new Product("Mug", "Home", 1200));

Map<String, List<Product>> byCategory = products.stream()
    .collect(Collectors.groupingBy(Product::category));
Map<String, Integer> totals = products.stream()
    .collect(Collectors.groupingBy(Product::category,
        Collectors.summingInt(Product::priceCents)));
List<String> mostExpensive = products.stream()
    .sorted(Comparator.comparingInt(Product::priceCents).reversed())
    .limit(2).map(Product::name).toList();
int total = products.stream().mapToInt(Product::priceCents).sum();
List<List<String>> baskets = List.of(List.of("Pen", "Mug"), List.of("Pen"));
Set<String> distinctItems = baskets.stream().flatMap(List::stream)
    .collect(Collectors.toSet());
Map<Boolean, List<Product>> affordable = products.stream()
    .collect(Collectors.partitioningBy(p -> p.priceCents() < 1000));
```

Sorting occurs before mapping to names. Operations remain lazy until a terminal operation runs; collectors avoid shared mutable side effects.''',
'y26-2.24': '''**Fictional example: reserving seats for a workshop**

```java
interface SeatReservation {
    boolean reserve(int seats);
}
final class Workshop implements SeatReservation {
    private final int capacity;
    private int reserved;
    Workshop(int capacity) {
        if (capacity < 0) throw new IllegalArgumentException("capacity");
        this.capacity = capacity;
    }
    @Override
    public synchronized boolean reserve(int seats) {
        if (seats <= 0) throw new IllegalArgumentException("seats");
        if (seats > capacity - reserved) return false;
        reserved += seats;
        return true;
    }
}
```

Private state demonstrates encapsulation, the interface defines an abstraction, and callers can use different implementations polymorphically. Prefer composition over an unnecessary inheritance hierarchy. The atomic check/update protects a single object's invariant. Multiple application instances require database transactions or another shared concurrency mechanism; durable idempotency and cancellations need additional design.''',
'y26-3.11': '''**Fictional SQLite example: customers and orders**

All names, IDs, and amounts below are invented. This schema is independent of any company system.

```sql
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    customer_name TEXT NOT NULL
);
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    status TEXT NOT NULL
);
INSERT INTO customers VALUES (1, 'Alex Example'), (2, 'Sam Sample'), (3, 'Pat Demo');
INSERT INTO orders VALUES
    (101, 1, 2500, 'PAID'), (102, 1, 4000, 'PENDING'), (103, 2, 1500, 'PAID');

-- Join related rows.
SELECT c.customer_name, o.order_id, o.total_cents
FROM customers c JOIN orders o ON o.customer_id = c.customer_id;

-- Customers without orders: Pat Demo.
SELECT c.customer_name FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;

-- Group and filter aggregate results: customer 1, total 6500.
SELECT customer_id, SUM(total_cents) AS total_spent
FROM orders GROUP BY customer_id HAVING SUM(total_cents) > 3000;

-- Orders above the overall average: order 102.
SELECT order_id FROM orders
WHERE total_cents > (SELECT AVG(total_cents) FROM orders);

-- Status counts: PAID 2, PENDING 1.
SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status;

-- Largest order per customer, with deterministic tie-breaking.
SELECT customer_id, order_id, total_cents FROM (
    SELECT customer_id, order_id, total_cents,
        ROW_NUMBER() OVER (
            PARTITION BY customer_id ORDER BY total_cents DESC, order_id
        ) AS row_num
    FROM orders
) ranked WHERE row_num = 1;
```

The examples demonstrate joins, anti-joins, GROUP BY/HAVING, subqueries, and window functions. Money uses integer cents to avoid floating-point rounding in this sample.''',
'y26-4.25': '''Rate limits bound accepted work, timeouts bound waiting, and retry budgets bound repeated work. Use backoff with jitter and retry only appropriate failures.

**Fictional transactional outbox**

```sql
CREATE TABLE demo_outbox (
    event_id VARCHAR(36) PRIMARY KEY,
    entity_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    payload TEXT NOT NULL,
    published_at TIMESTAMP NULL
);
```

The outbound team in this fictional example writes an order and its event to the same database transaction. A relay publishes pending events and records progress. A crash after publishing but before recording progress can cause redelivery, so consumers deduplicate by event_id. The outbox closes the database-write/event-intent gap; it does not promise exactly-once external side effects.''',
}


def sanitize_record(record):
    record = dict(record)
    body = record['body']
    if record['year'] == 2026:
        # Source-specific project evidence always starts a trailing section.
        # Discard that section rather than cosmetically renaming internal code.
        lines = body.splitlines()
        cutoff = next((i for i, line in enumerate(lines)
                       if line.startswith('**') and
                       (line.startswith(('**Project', '**Interview wording'))
                        or has_private_marker(line))), len(lines))
        body = '\n'.join(lines[:cutoff])
        body = re.sub(r'(?m)^.*(?:⚠️.*(?:project|corporate)|No Terraform usage was verified).*(?:\n|$)', '', body)
        body = body.replace(" The projects' actual deployed versions were not confirmed.", '')
        body = '\n'.join(line for line in body.splitlines() if not has_private_marker(line))
        body = body.replace('reservation outcomes, capacity-full versus system failures, idempotency hits, and no-eligible-FC results', 'completed orders, failed payments, cancellations, and duplicate-request counts')
    body = EXAMPLES.get(record['id'], body).strip().rstrip('-').strip()
    # Private workspace links are not useful public references.
    body = re.sub(r'\[([^\]]+)\]\(https?://(?:app\.)?notion\.(?:com|so)/[^)]+\)', r'\1', body)
    record['body'] = body
    if record['id'] == 'y26-projects':
        record['title'] = 'Fictional allocation team / outbound team learning context'
    if record['id'] == 'y26-3.11':
        record['title'] = 'Coding: SQL Using Fictional Customers and Orders'
    if record['id'] == 'y26-2.24':
        record['title'] = 'Coding: OOP Design — Workshop Seat Reservation'
    if record['year'] == 2026:
        record['caution'] = 'Public edition: private project evidence has been removed. Examples use fictional systems and data.'
    return record
