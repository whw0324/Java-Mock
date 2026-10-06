# Consolidation and content review

The revised library uses 2026 as its primary spine. 2025 contributes additional explanations, examples, and independent topics. Source files are not rewritten. Each source entry belongs to exactly one consolidated topic; automated coverage checks account for all 307 original entries.

## Representative decisions

| Primary topic | Integrated contributions |
| --- | --- |
| The Four OOP Principles (2026 2.6) | 2025 OOP, is-a/has-a, overloading/overriding, composition example |
| Thread-Safe Singleton Implementations (2026 2.2) | Eager/lazy initialization, singleton hazards, 2026 coding examples |
| Bean Scopes (2026 1.6) | Both singleton-to-prototype and prototype-to-singleton injection cases |
| Mockito (2026 1.33) | Mock/spy, annotations, stubbing behavior |
| SQL coding (2026 3.11) | Employee aggregation, joins, corrected distinct-salary ranking, trailing SQL reference |
| RabbitMQ (2025) | Components, exchanges, exact/pattern routing, dead-lettering |
| Stream API Reference (2025) | Source/collection differences, laziness, intermediate and terminal operations, map/flatMap, parallelism |

See `public/data/merge-map.json` for all 187 primary topics and every original member ID. Distinct facets are intentionally kept where merging would obscure the question, such as Stream coding versus the full terminal-operation reference, or HashMap versus HashSet internals.

## Reviewed corrections

- The Stream study reference sorts Person objects before mapping to names; clarifies identity/no-identity reduction, array generation, empty-stream matching, one-use pipelines, and encounter order. [Java Stream API](https://docs.oracle.com/en/java/javase/18/docs/api/java.base/java/util/stream/Stream.html)
- Hibernate Session is not thread-safe, even when obtained through current-session context management. merge returns a managed copy/instance; the detached argument is not automatically reattached. Legacy get/load and update/saveOrUpdate behavior is labeled as version-dependent. [Hibernate 6.6 Session API](https://docs.hibernate.org/orm/6.6/javadocs/org/hibernate/Session.html)
- A semaphore permit must not be unconditionally released when acquisition did not succeed in this resource-limiting pattern. [Java Semaphore API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/Semaphore.html)
- A RabbitMQ direct exchange can route to multiple matching queues. A DLX is an exchange, distinct from the queue it routes to. [Exchanges](https://www.rabbitmq.com/docs/exchanges), [dead-letter exchanges](https://www.rabbitmq.com/docs/next/dlx)
- The Employee example uses DENSE_RANK for the third distinct salary with ties; a one-row offset is not an equivalent query.

These are targeted checks, not a claim that every historical statement was independently audited. Sanitized source excerpts remain labeled as historical material. Private project evidence is excluded from all public answers, references, and legacy recall passages. Public examples are fictional.

## Exercise coverage

The bank now contains 205 manually authored concept exercises covering all 186 practice topics. An automated check fails content generation if a practice topic lacks an authored exercise. The remaining fictional team-context entry is reference-only. Source recall is a separate optional mode and is not counted as concept coverage.

Old source bookmarks map to their new primary topics. Existing concept IDs and answer records remain stable. Legacy recall questions are retained only for previous history, bookmarks, and mistake review; they do not appear in newly generated sessions.
