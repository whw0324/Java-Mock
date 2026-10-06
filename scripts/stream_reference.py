STREAM_REFERENCE = '''A Stream describes a computation over a source; it does not store elements like a collection. A pipeline has a source, zero or more intermediate operations, and a terminal operation. A consumed stream must not be reused.

## Intermediate operations

| Operation | Purpose | Relevant functional interface |
| --- | --- | --- |
| map | Transform each element, possibly changing its type | Function<T, R> |
| filter | Retain matching elements | Predicate<T> |
| flatMap | Transform each element to a stream and flatten the results | Function<T, Stream<R>> |
| distinct | Remove duplicates according to equality | None |
| sorted | Sort naturally or using a comparator | Comparator<T> when supplied |
| limit | Retain at most N elements | None |
| skip | Skip the first N elements in encounter order | None |

Intermediate operations are lazy. A terminal operation drives traversal, and short-circuiting may avoid processing the entire source. Stateful operations such as sorted may need buffering.

## Correctly typed pipeline

Sort Person objects before mapping them to String names:

```java
List<String> names = people.stream()
    .filter(p -> p.getAge() >= 18)
    .sorted(Comparator.comparingInt(Person::getAge).reversed())
    .map(Person::getName)
    .distinct()
    .skip(2)
    .limit(5)
    .collect(Collectors.toList());
```

After map(Person::getName), the stream contains Strings; Person::getAge no longer applies. Here distinct removes repeated names, and skip/limit operate on the ordered distinct-name sequence.

## Terminal operations

| Operation | Result | Key point |
| --- | --- | --- |
| forEach | void | Performs an action using Consumer; parallel execution does not promise encounter order |
| forEachOrdered | void | Respects encounter order when it exists |
| toArray | Object[] or a generated T[] | The typed overload accepts an array generator such as Integer[]::new |
| reduce | T, U, or Optional<T>, depending on overload | Use a compatible identity and associative operation for parallel reduction |
| collect | R | Mutable reduction using a Collector or supplier/accumulator/combiner |
| min / max | Optional<T> | Requires a Comparator; empty source produces empty Optional |
| count | long | Counts elements; avoid depending on side effects in a pipeline |
| anyMatch | boolean | True if any match; false for an empty stream |
| allMatch | boolean | True if all match; true for an empty stream |
| noneMatch | boolean | True if none match; true for an empty stream |
| findFirst | Optional<T> | Respects encounter order if one exists |
| findAny | Optional<T> | May choose any element; not necessarily the first |

## Reductions, arrays, and grouping

```java
int sum = Stream.of(1, 2, 3).reduce(0, Integer::sum);
Optional<Integer> noIdentity = Stream.<Integer>empty().reduce(Integer::sum);
Integer[] values = Stream.of(1, 2, 3).toArray(Integer[]::new);
Map<String, List<Person>> byName = people.stream()
    .collect(Collectors.groupingBy(Person::getName));
```

The identity overload returns 0 for an empty integer sum; the no-identity overload returns Optional.empty(). Collector is an interface with several methods, not itself a single-abstract-method functional interface.

## Parallel streams

Use parallelStream() or parallel() deliberately. Parallel execution is not guaranteed to be faster; splitting, ordering, merging, and contention add costs. Prefer stateless, non-interfering operations. Do not mutate an ordinary shared ArrayList from a parallel forEach; use an appropriate collector. Ordered output and thread-safe side effects are different requirements.

## Interview checkpoints

Explain laziness, one-use pipelines, map versus flatMap, ordering, short-circuiting, empty-stream results, and how reduction differs from mutable collection. For coding questions, track the element type after every operation and test empty inputs and duplicate values.
'''
