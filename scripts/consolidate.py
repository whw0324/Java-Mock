"""Reviewed topic map: 2026 is the primary source; independent 2025 topics stay.
No fuzzy title matching is used. Original passages are retained in references.
"""
from copy import deepcopy
# Map only duplicates or explicit facets of the same interview question.
GROUPS = {
 'y26-1.1':[101], 'y26-1.2':[103,111], 'y26-1.3':[100], 'y26-1.4':[104],
 'y26-1.5':[102], 'y26-1.6':[105,106,107], 'y26-1.10':[109], 'y26-1.11':[108],
 'y26-1.12':[32], 'y26-1.14':[19], 'y26-1.15':[67,126], 'y26-1.16':[124],
 'y26-1.17':[125,127,128,153], 'y26-1.18':[155], 'y26-1.22':[112],
 'y26-1.23':[120,121,122,123], 'y26-1.24':[110], 'y26-1.25':[135],
 'y26-1.29':[134,143], 'y26-1.30':[66], 'y26-1.33':[130,131,132],
 'y26-1.39':[85], 'y26-1.40':[113,114], 'y26-1.42':[154], 'y26-1.48':[84],
 'y26-2.1':[13], 'y26-2.2':[56,57,58,59,60], 'y26-2.3':[17,18,20,21],
 'y26-2.4':[44,45,46], 'y26-2.5':[47], 'y26-2.6':[2,3,4],
 'y26-2.7':[33,34], 'y26-2.9':[15], 'y26-2.10':[31], 'y26-2.11':[54],
 'y26-2.12':[16], 'y26-2.14':[36], 'y26-2.15':[8], 'y26-2.16':[5,53],
 'y26-2.17':[6], 'y26-2.19':[1], 'y26-2.20':[9,10], 'y26-2.21':[41,42],
 'y26-3.1':[91], 'y26-3.2':[89], 'y26-3.3':[97], 'y26-3.4':[95],
 'y26-3.5':[83], 'y26-3.6':[98], 'y26-3.7':[99], 'y26-3.11':[90,92],
 'y26-4.1':[136], 'y26-4.2':[139,148,161], 'y26-4.3':[160,162],
 'y26-4.4':[137,138], 'y26-4.6':[158],
 'y26-5.1':[144,145], 'y26-5.5':[156], 'y26-6.1':[40], 'y26-6.2':[159], 'y26-6.5':[141],
 'y25-037':[38,39], 'y25-061':[62,63], 'y25-065':[142],
 'y25-070':[71,72], 'y25-075':[76,86], 'y25-077':[78],
 'y25-146':[163,164], 'y25-149':[150,151,152],
 'y25-extra-stream':[48,49,50,51,52],
}
# Two 2026 entries cover the same scope; keep the earlier headline.
EXTRA_ALIASES={'y26-1.43':'y26-1.25','y26-5.22':'y26-5.4','y26-2.25':'y26-2.2','y25-extra-sql':'y26-3.11'}
ADDITIONS={
'y26-1.1':'Constructor, setter, and field injection are different ways for the container to supply collaborators. Depend on an interface such as `Engine`, so a test can pass a fake implementation without creating the production graph.',
'y26-1.2':'`@Component` is the general stereotype; `@Service` expresses a business-service role; `@Repository` expresses persistence responsibilities and participates in exception translation when configured. An annotated class and a Spring Data repository interface are different registration mechanisms.',
'y26-1.3':'Spring supplies the core container and framework modules. Boot adds conventions, starters, embedded servers, and conditional auto-configuration; it does not replace Spring.',
'y26-1.4':'BeanFactory supplies basic container access. ApplicationContext integrates events, resources, internationalization, and automatic infrastructure registration. Initialization timing can be configured; neither interface implies one universal eager/lazy rule.',
'y26-1.5':'Use constructor injection for required collaborators and setters for genuinely optional dependencies. A constructor also makes a plain unit test possible without loading a Spring context.',
'y26-1.6':'Injecting a singleton A into prototype B means each B can share the same A. Injecting a prototype B into singleton A normally resolves B only during A creation. Use `ObjectProvider<B>.getObject()` or a suitable scoped proxy when repeated lookup is required.',
'y26-1.10':'A constructor cycle cannot be resolved merely by renaming beans. Extract a shared responsibility or change dependency direction. Deferring lookup can break creation-time cycles but retains architectural coupling.',
'y26-1.11':'When two implementations implement the same interface, `@Qualifier` expresses which collaboration is intended; `@Primary` supplies the preferred candidate when no stronger selection is given.',
'y26-1.12':'Use ExecutorService to centralize concurrency and lifecycle management rather than creating a new platform thread for every request. Bounded resources require a rejection/backpressure policy; call shutdown when the owner stops.',
'y26-1.14':'Translate domain failures into a consistent HTTP error contract. A custom exception carries business meaning; the global handler maps it to a status and public message without exposing internal stack traces.',
'y26-1.15':'A proxy implements or presents the target contract and delegates around cross-cutting work such as logging, authorization, or transactions. Spring proxy interception applies to calls through the proxy, not ordinary self-invocation.',
'y26-1.16':'Place constraints on a DTO, trigger validation at the HTTP boundary, and map violations consistently. Validation of shape does not replace authorization or business invariant checks in the service layer.',
'y26-1.17':'Separate authentication from authorization. Authentication establishes an identity; authorization checks permitted actions. Stateless token handling still requires signature and claim validation on requests; simply decoding a JWT does not authenticate anyone.',
'y26-1.18':'Protect both route-level access and sensitive service operations where appropriate. Match claims to authorities deliberately; a token being well-formed does not imply that its holder may access every endpoint.',
'y26-1.22':'Keep the transactional boundary around a coherent service operation. Proxy bypass, exception policy, and transaction-manager selection affect the result; an annotation alone does not make unrelated remote calls atomic.',
'y26-1.23':'HTTP method semantics matter: GET is intended to retrieve, PUT replaces a resource representation and is idempotent by semantics, and PATCH applies a partial update whose idempotence depends on the operation. REST is an architectural style; SOAP defines a messaging protocol. Statelessness does not prohibit a database.',
'y26-1.25':'The 2025 notes mention Jasypt for encrypted property values. Encryption still needs protected decryption-key management and rotation; storing that key beside the ciphertext defeats the protection. Prefer environment/secret-manager integration and never commit plaintext credentials.',
'y26-1.29':'`@Profile` conditionally registers beans; profile-specific configuration changes settings. The number of environments is an organizational choice, not a Spring limit. Avoid embedding production credentials in a profile file.',
'y26-1.30':'Closed allows calls while measuring failures; open rejects calls for a period; half-open admits limited probes. A fallback must have meaningful degraded behavior and should not conceal persistent errors.',
'y26-1.33':'`@Mock` creates a mock; `@Spy` wraps partial real behavior; `@InjectMocks` attempts to inject test doubles into the subject; `@Captor` declares an argument captor. Initialize annotations with the appropriate extension/setup. Mockito annotations alone do not create a full Spring container.',
'y26-1.39':'EAGER requires the provider to fetch the relationship; LAZY is a deferred-fetch hint. Neither setting alone guarantees a particular SQL join shape. Access outside the persistence context and N+1 behavior must be considered together.',
'y26-1.40':'In server-rendered MVC, a view name can be resolved to a template by a ViewResolver. A REST controller typically writes its return value through an HTTP message converter instead. View resolution is not mandatory for every response.',
'y26-1.42':'Centralized configuration provides consistent delivery and environment separation. Secret values require access control and lifecycle management beyond ordinary configuration distribution.',
'y26-1.48':'For bidirectional relationships, identify the owning side and keep both Java references consistent. In a typical parent/child mapping, the child `@ManyToOne` owns the foreign key and the parent `@OneToMany(mappedBy=...)` is inverse. Cascade and orphan removal are separate lifecycle decisions.',
'y26-2.1':'Correct keys need a consistent equals/hashCode contract. Mutating a field used in hashing after insertion can make a lookup fail because the entry remains in the old bucket.',
'y26-2.2':'The older notes compare eager and lazy initialization and discuss reflection, serialization, and cloning. Prefer an enum or holder for ordinary use. A simple constructor guard is not a universal defense against reflective construction. A serializable class-based singleton can use readResolve to return its canonical instance.',
'y26-2.3':'An exception propagates up the call stack until a matching handler is found. A custom checked exception extends Exception; a custom unchecked one typically extends RuntimeException. Catch errors at a layer that can recover or translate them, and preserve the cause.',
'y26-2.4':'A lambda supplies the implementation of the target functional interface method. The target type determines parameter/return compatibility; default and static interface methods do not add abstract-method requirements.',
'y26-2.5':'Comparable defines natural ordering on the type. Comparator supplies an external strategy and allows several different orderings for the same class. Use Comparator.comparing/thenComparing rather than subtraction that might overflow.',
'y26-2.6':'''**Inheritance and composition**: `Dog extends Animal` is an is-a relationship; `Car` holding an `Engine` is has-a. Prefer composition when the collaboration does not satisfy substitutability.

**Overloading and overriding**: overloading uses different parameter signatures and is selected at compile time. Overriding supplies a subtype implementation of an inherited instance method and participates in runtime dispatch. The `@Override` annotation helps the compiler check intent.

```java
interface Engine { void start(); }
final class Car {
    private final Engine engine;
    Car(Engine engine) { this.engine = engine; }
    void start() { engine.start(); }
}
```
This hides internal state, exposes a behavioral abstraction, and delegates to interchangeable engine implementations.''',
'y26-2.7':'Use the same lock to protect a shared invariant. Deadlock can arise from cyclic lock acquisition; a consistent lock order and reduced lock scope help. Visibility, atomicity, and liveness are separate concerns.',
'y26-2.9':'A synchronized map serializes method calls through its wrapper lock; iteration still requires appropriate external synchronization. ConcurrentHashMap supports concurrent operations and weakly consistent traversal. The segmented-lock illustration from old notes describes historical implementations, not all current JDKs.',
'y26-2.10':'Future exposes completion, cancellation, and blocking retrieval. CompletableFuture adds composition such as thenApply, thenCompose, and thenCombine. Calling join/get still blocks the caller; asynchronous stages are not automatically nonblocking end to end.',
'y26-2.11':'Use Optional for an explicit possibly-absent result. `orElse` evaluates its argument eagerly; `orElseGet` invokes its supplier only when empty. Avoid calling get without establishing presence.',
'y26-2.12':'An array has fixed length and can contain primitives; ArrayList resizes and stores references (with boxing for primitives). ArrayList has efficient indexed access. LinkedList insertion is constant time only once the relevant node/iterator position is known; locating an indexed position is linear.',
'y26-2.14':'Serializable and Cloneable are marker interfaces: they signal a capability without declaring ordinary behavior methods. A marker is not a replacement for understanding the API that interprets it.',
'y26-2.15':'Copy mutable constructor arguments and avoid returning mutable internal references. A final reference alone is insufficient because the object it references may still change.',
'y26-2.16':'An interface can provide default and static methods; an abstract class can hold instance state and constructors. Static interface methods are called on the declaring interface. Conflicting inherited defaults require an explicit resolution.',
'y26-2.17':'Java avoids multiple class inheritance, but two interface defaults with the same signature can conflict. Override the method and, where allowed, explicitly delegate with InterfaceName.super.method().',
'y26-2.19':'The Car/Engine example shows responsibility separation and depending on an abstraction. A new engine type should not force changes to Car. Do not force a vehicle to implement unrelated fuel/charge operations merely to fit a broad interface.',
'y26-2.20':'String immutability supports safe sharing, stable hashes, and interning. `==` compares object identity; `equals` compares character content. Interned literals can share a reference, but content comparison must not depend on that sharing.',
'y26-2.21':'The runtime includes class loading, execution/JIT, garbage collection, and runtime data areas. Many collectors distinguish young/old generations. PermGen belongs to older HotSpot versions; modern HotSpot uses Metaspace for class metadata, backed by native memory.',
'y26-3.1':'Schema and query requirements should drive the choice. SQL/NoSQL labels do not automatically determine consistency guarantees or scaling behavior; evaluate the actual database and configuration.',
'y26-3.2':'Atomicity concerns the transaction as a unit, while isolation concerns interference among transactions. Do not confuse ACID consistency (valid data constraints) with the consistency model discussed by CAP.',
'y26-3.3':'The 2025 notes add database-specific checks: plan selection, index usefulness, excessive round trips, pagination, and connection pressure. Measure before and after rather than adding indexes indiscriminately.',
'y26-3.4':'Index behavior is database-specific. A clustered organization affects how table data is stored; secondary indexes provide alternate access paths and incur maintenance costs. A primary key is a logical constraint and should not be universally equated with one physical layout.',
'y26-3.5':'Use a junction table with foreign keys. If the association has its own business fields, model it as an entity rather than hiding it inside a bare many-to-many collection.',
'y26-3.6':'The important trade-off is behavior during a partition. Do not memorize CAP as an unrestricted choose-any-two rule at all times.',
'y26-3.7':'Optimistic locking detects conflicts using a version/check; pessimistic locking acquires a database lock before conflicting work. Choose based on contention and retry costs, and still design transactions to avoid deadlocks.',
'y26-3.11':'''**Employee examples from 2025**

```sql
SELECT department, COUNT(*) AS employee_count, MAX(salary) AS highest_salary
FROM Employee
GROUP BY department;
```

To return **all employees with the third-highest distinct salary**, retain ties with a window function:

```sql
WITH ranked AS (
    SELECT id, department, salary,
           DENSE_RANK() OVER (ORDER BY salary DESC) AS salary_rank
    FROM Employee
    WHERE salary IS NOT NULL
)
SELECT id, department, salary
FROM ranked
WHERE salary_rank = 3;
```

`LIMIT 1 OFFSET 2` picks one sorted row, not every employee at the third distinct salary. INNER JOIN keeps matches; LEFT JOIN preserves left-side rows with NULL right-side values for nonmatches. Aggregation collapses groups, while window functions retain row detail. The trailing 2025 SQL sample is retained in source excerpts, but its premature semicolon and grouped/windowed expression are not copied into this corrected example.''',
'y26-4.1':'Independent deployability comes with network failures, consistency choices, and operational overhead. A modular monolith may be simpler when independent scaling and deployment are not required.',
'y26-4.2':'Asynchronous execution within one JVM (for example an executor) differs from durable asynchronous messaging between services. Events describe something that happened; consumers should tolerate duplicates and evolve schemas deliberately.',
'y26-4.3':'Saga choreography reacts to events; orchestration uses a coordinator to direct steps. Both rely on local transactions and compensating business actions. Compensation is not necessarily a physical reversal of every side effect.',
'y26-4.4':'A downstream failure can consume upstream threads and connections, causing a cascade. Combine bounded timeouts, limited retries, circuit breakers, and resource isolation. Retries must respect idempotency and retry budgets.',
'y26-4.6':'Kafka Streams is a client library for processing Kafka records, including transformations, joins, and stateful aggregation. It is not another broker. The old notes mention ZooKeeper; metadata coordination depends on Kafka generation and deployment, so use the 2026 KRaft context when applicable.',
'y26-5.1':'A representative pipeline builds and tests a JAR, creates a container image, pushes it to a registry, then updates the deployment. A registry stores artifacts; the runtime platform executes them. CI success does not itself imply production deployment.',
'y26-5.5':'Vertical scaling changes capacity per instance; horizontal scaling changes the instance count. Horizontal application scaling still requires external/shared state management where requests can reach different instances.',
'y26-6.1':'A leak means objects remain reachable when no longer needed. Combine post-GC trends with retained-size and reference-path analysis; high allocation rate alone is not proof of a leak.',
'y26-6.2':'Use structured logs and correlation identifiers so one request can be followed across services. Logging complements metrics and traces; logs alone are not a complete health signal.',
'y26-6.5':'Observe latency, traffic, errors, and resource saturation together. Correlate dashboards with logs/traces and deployment changes before changing configuration.',
'y25-037':'`transient` excludes a field from default Java serialization, not from all custom formats. Use matching object input/output streams only for trusted, controlled data; native deserialization is not a safe generic format for arbitrary untrusted input.',
'y25-061':'A factory centralizes object construction behind an interface. An abstract factory creates compatible families of objects. A PaymentFactory implementation can construct a payment strategy while PaymentProcessor depends only on the factory contract.',
'y25-065':'An API gateway can route, authenticate, and enforce edge policies. It is an architectural choice, not a requirement that every service call must pass through it. Service discovery and service-level authorization remain separate concerns.',
'y25-070':'Use PreparedStatement placeholders for untrusted values rather than concatenating them into SQL. Placeholders do not parameterize identifiers such as arbitrary table names; validate/allowlist those separately. CallableStatement invokes stored procedures, which must also avoid unsafe dynamic SQL.',
'y25-075':'ORM maps entity state to relational data and can reduce routine mapping code. Hibernate does not eliminate SQL tuning or guarantee faster execution than JDBC. Configuration includes a datasource, mappings, and transaction integration; schema migration is a separate production concern.',
'y25-077':'SessionFactory is designed for shared use; a Session is not thread-safe. `getCurrentSession()` resolves a session according to configured context management; it does not make that Session safe to share across threads. `openSession()` creates a separately managed Session whose owner must close it.',
'y25-146':'Trace an example request from client through gateway/routing to controller, service, persistence, and response. Explain service-owned data, synchronous calls versus events, discovery, authentication, and observability. Use a concrete business flow instead of listing infrastructure names.',
'y25-149':'An exchange routes to queues via bindings; a queue holds messages for consumption. Direct exchanges use exact key matching and may route to multiple matching queues. Topic exchanges use patterns; fanout broadcasts to bound queues; headers exchanges match header attributes. A DLX is an exchange for eligible dead-lettered messages, not a queue or a handler for every unroutable publish.',
}
# Reviewed replacements for problematic legacy summaries; raw versions remain expandable.
REPLACEMENTS={
'y25-007':'''Java always passes arguments by value. For an object argument, the copied value is a reference. The method can mutate the referenced object, but reassigning its local parameter does not reassign the caller's variable.

```java
static void change(StringBuilder value) {
    value.append("!");
    value = new StringBuilder("replacement");
}
// A caller holding new StringBuilder("Hi") observes "Hi!" after change.
```

The original notes also compare arrays and lists. Arrays have fixed length; ArrayList resizes. ArrayList indexed access is constant time; finding a position in LinkedList is linear. Node insertion costs must be distinguished from finding that node.''',
'y25-030':'''A Semaphore limits concurrent access using permits. Acquire a permit before entering the protected operation and release only a permit actually acquired.

```java
semaphore.acquire(); // If interrupted here, do not release a permit.
try {
    useLimitedResource();
} finally {
    semaphore.release();
}
```

The enclosing method handles or declares InterruptedException. Placing an unconditional release around a failed acquire can incorrectly increase the permit count.''',
'y25-027':'''Java exposes six Thread.State values: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, and TERMINATED.

| State | Meaning |
| --- | --- |
| NEW | Created but not started |
| RUNNABLE | Running in the JVM or eligible to execute |
| BLOCKED | Waiting to acquire a monitor lock |
| WAITING | Indefinitely waiting for another thread's action |
| TIMED_WAITING | Waiting for a bounded duration |
| TERMINATED | Execution has finished |

Running is not a separate enum value. A thread can revisit runnable/waiting/blocked states; the lifecycle is not a single mandatory linear ordering.''',
'y25-075':'''ORM maps objects and relationships to relational tables. Hibernate is an ORM provider that manages entity state, dirty checking, query execution, and persistence-context identity.

It reduces repetitive mapping code, but SQL plans, transaction boundaries, fetch strategy, and schema design still matter. Lazy loading and caching can help some access patterns and harm others. JDBC remains appropriate for explicit SQL control. A production schema should be managed deliberately rather than assuming automatic schema generation is always suitable.''',
'y25-077':'''SessionFactory is a shared, thread-safe factory for persistence sessions. Session represents a persistence context/unit of work and is not thread-safe.

- `openSession()` opens a new Session whose lifecycle you manage.
- `getCurrentSession()` obtains the Session associated with the configured current-session context, often integrated with a transaction manager.
- Context binding does not make Session thread-safe; do not share it between concurrent tasks.
- Session lifetime and transaction lifetime are related but not identical concepts.''',
'y25-079':'''An entity may be new/transient, managed/persistent, detached, or removed.

- A new instance has not been made persistent.
- A managed instance belongs to the current persistence context; changes may be flushed to the database.
- A detached instance no longer belongs to that context; mutating it does not trigger dirty checking there.
- A removed instance is marked for deletion.

`persist` makes a new entity managed. `detach`, `clear`, or closing a context detaches managed instances. `merge` copies state into a managed instance and returns that instance; the original argument does not become managed merely because merge was called.''',
'y25-080':'''Legacy Hibernate `get` retrieves an entity or returns null when it is absent; it may use the persistence context or cache rather than always issuing SQL. Legacy `load` may return a proxy and defer database access; absence can surface when the proxy is initialized.

Use the APIs appropriate to the Hibernate version, such as find/get and getReference. A reference is useful for an association when existence is already known, not as a guaranteed existence check.''',
'y25-081':'''In legacy Hibernate, update reassociates a detached entity and saveOrUpdate chooses persistence behavior based on entity state. These methods are version-dependent legacy APIs.

`merge` copies state into a managed instance and returns it. The original argument remains detached. Continue work with the returned instance when managed behavior is required. If another instance with the same identity is already managed, merge copies into that instance rather than making both instances managed.''',
'y25-087':'''HQL queries use entity names and mapped properties rather than raw table/column names. Bind parameters instead of concatenating input.

Criteria builds a query programmatically. Using a generated static metamodel provides stronger compile-time attribute checking than string paths such as root.get("username"); a Criteria query is not automatically immune to every runtime naming error.''',
'y25-146':'''Describe one business request end to end: client, routing/gateway, service boundary, business logic, persistence, and response. Add asynchronous events only where the flow requires them.

Explain ownership of data, failure behavior, authentication/authorization, service discovery, and how logs/metrics/traces follow the request. Independent deployments and bounded contexts matter more than a long list of infrastructure products. A gateway is optional, and not every operation must publish an event.''',
'y25-149':'''RabbitMQ is a message broker for asynchronous communication. Producers publish to exchanges; bindings route messages to queues; consumers receive and acknowledge deliveries.

| Exchange | Routing behavior |
| --- | --- |
| Direct | Exact match between a routing key and binding key; multiple queues can match |
| Topic | Match dot-separated routing-key patterns (`*` for one word, `#` for zero or more) |
| Fanout | Route to all bound queues, ignoring the routing key |
| Headers | Match configured header attributes |

Consumer acknowledgments and publisher confirms cover different parts of delivery. Design for redelivery with idempotent consumers.

A dead-letter exchange receives eligible messages from queues, for example rejection without requeue or expiration, according to queue policies. It routes onward to queues through ordinary bindings. It is not synonymous with a dead-letter queue, and an unroutable initial publish is not automatically a dead-letter event.''',
}
def consolidate(original):
    raw={r['id']:deepcopy(r) for r in original}
    aliases={id:id for id in raw}
    for primary,items in GROUPS.items():
        assert primary in raw,primary
        for n in items:
            old=f'y25-{n:03}'
            assert aliases[old]==old,old
            aliases[old]=primary
    aliases.update(EXTRA_ALIASES)
    for key in aliases:
        while aliases[key]!=aliases[aliases[key]]:aliases[key]=aliases[aliases[key]]
    groups={}
    for r in original:groups.setdefault(aliases[r['id']],[]).append(raw[r['id']])
    result=[]
    for primary,refs in groups.items():
        r=deepcopy(raw[primary]);refs.sort(key=lambda x:(x['id']!=primary,-x['year'],x['line']))
        r['references']=refs;r['years']=sorted({x['year'] for x in refs},reverse=True)
        r['body']=REPLACEMENTS.get(primary,r['body'])
        # Appended summaries capture the unique contributions without repeating question headers.
        if primary in ADDITIONS:r['body']+='\n\n## Integrated examples and clarifications\n\n'+ADDITIONS[primary]
        if primary=='y26-5.4':r['body']+='\n\n## Terraform workflow and state\n\n'+raw['y26-5.22']['body']
        if primary=='y26-2.2':r['body']+='\n\n## Implementation examples\n\n'+raw['y26-2.25']['body']
        r['searchTitles']=' '.join(x['title'] for x in refs)
        r['caution']='2026 is the primary answer where available. Integrated clarifications resolve selected legacy inaccuracies; sanitized historical passages are available under Sanitized source excerpts. Internal examples are removed or replaced with fictional data.' if len(refs)>1 or primary in REPLACEMENTS else r['caution']
        if primary=='y25-extra-stream':
            from stream_reference import STREAM_REFERENCE
            r['title']='Stream API Reference: Pipelines, Intermediate and Terminal Operations'
            r['body']=STREAM_REFERENCE;r['supplement']=False
            r['caution']='Preserved 2025-only reference, combined with the 2025 Stream questions. The pipeline order and overload descriptions have been corrected; original passages remain available below.'
        if primary=='y25-061':r['title']='Factory and Abstract Factory Patterns: Purpose and Implementation'
        if primary=='y25-149':r['title']='RabbitMQ: Components, Exchanges, Routing, and Dead Lettering'
        if primary=='y25-037':r['title']='Java Serialization, Deserialization, and Transient Fields'
        if primary=='y25-146':
            r['title']='Design and Explain an End-to-End Microservice Architecture';r['category']=4
        result.append(r)
    result.sort(key=lambda r:(r['category'],r['year']!=2026,r['line']))
    assert sum(len(r['references']) for r in result)==len(original)
    return result,aliases
