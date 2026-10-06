"""English presentation translations. Original Markdown files remain untouched."""
import re
translations={
3:'Tags: Interview preparation and review',
18:'// 1. SRP: Car handles vehicle behavior; Engine handles engine logic.',
28:'// 2. OCP: Extend engine types without modifying Car.',
31:'// 3. LSP: Different engine implementations remain substitutable.',
42:'// 4. ISP: Define focused interfaces rather than requiring unused methods.',
62:'// 5. DIP: Car depends on the Engine interface, not a concrete implementation.',
743:'void sound(); // Declare an abstract method.',
744:'default void sleep(){Sout.("The animal is sleeping.");}} // Provide a default implementation.',
747:'public void sound() {Sout.("The cat meows.");} // Implement the abstract method.',
749:'public void sleep() {Sout.("The cat is sleeping in a cozy corner.");}} // Override the default method.',
754:'cat.sound(); // Invoke the implemented method.',
755:'cat.sleep();}} // Invoke the overridden default method.',
908:'public PaymentProcessor() { // Register payment factories.',
909:'// Dynamically load PaymentFactory implementations from the Spring context.',
935:'// Product class: Computer',947:'// Abstract builder',957:'// Concrete builder: GamingComputerBuilder',965:'// Director class',978:'// Create a GamingComputer builder.',
1279:'Hibernate provides two levels of caching:',
1281:'- **First-level cache**: Enabled by default and scoped to a Session. Repeated retrieval of the same entity can use the persistence context.',
1282:'- **Second-level cache**: Configured explicitly and associated with the SessionFactory; enables cached data to be shared across Sessions.',
1284:'### Example',1286:'Using the first-level cache:',
1292:'Employee emp1 = session.get(Employee.class, 1L); // First retrieval executes SQL.',
1293:'Employee emp2 = session.get(Employee.class, 1L); // Repeated retrieval uses the cache.',
1297:'Enable a second-level cache, such as Ehcache:',
1304:'- **First-level cache**:',1305:'- Hibernate checks the first-level cache first.',1306:'- Return an existing entity directly.',
1307:'- **Second-level cache**:',1308:'- If absent from the first-level cache, check whether second-level caching is enabled.',1309:'- Load cached data if the second-level cache contains it.',
1310:'- **Database**:',1311:'- On a cache miss, query the database and populate the first-level cache and, if configured, the second-level cache.',
1475:'When unsure whether the object already exists in the database | For generic save or update logic. |',
2758:'## Topics to revisit',
2914:'-- Count employees in each department.',2917:'-- Find the highest salary in each department.',2920:'-- Find the lowest salary in each department.',2923:'-- Count distinct salaries in each department.',2926:'-- Rank salaries within each department.',
2942:'- `map()` uses `Function<T, R>` to transform elements.',2943:'- `filter()` uses `Predicate<T>` to select elements.',2944:'- `distinct()` removes duplicates without an additional functional interface.',2945:'- `sorted()` can use `Comparator<T>` to order elements.',2946:'- `limit()` bounds the number of elements.',2947:'- `skip()` skips the first N elements.',
3003:'The Java Stream terminal operations below process elements, collect results, perform reductions, or evaluate conditions. Their return types and functional interfaces are listed with examples.',
3007:'- **Purpose**: Perform an action on each stream element.',3008:'- **Return type**: `void`.',3009:'- **Functional interface**: `Consumer<T>` supplies the action for each element.',
3016:'.forEach(n -> System.out.println(n)); // Print each element.',
3022:'- **Purpose**: Convert stream elements into an array.',3023:'- **Return type**: `Object[]` or `T[]`, depending on the overload.',3024:'- **Functional interface**: The no-argument overload needs none; the typed overload uses an array generator.',
3031:'.toArray(Integer[]::new); // Produce an Integer array.',
3038:'- **Purpose**: Combine elements into a single result, such as a sum or product.',3039:'- **Return type**: The no-identity overload returns `Optional<T>`; identity overloads return the result directly.',3040:'- **Functional interface**: A `BinaryOperator<T>`, or accumulator and combiner functions for the relevant overload.',
3047:'.reduce(0, (a, b) -> a + b); // Compute the sum.',
3054:'- **Purpose**: Collect elements into a result, such as a List, Set, or Map.',3055:'- **Return type**: `R`, the collected result.',3056:'- **Collector**: `Collector<T, A, R>`, for example `Collectors.toList()`.',
3063:'.collect(Collectors.toList()); // Collect into a List.',3068:'### 5. `min()` and `max()`',
3070:'- **Purpose**: Find the smallest or largest element according to a comparator.',3071:'- **Return type**: `Optional<T>` because the stream may be empty.',3072:'- **Functional interface**: `Comparator<T>` defines the ordering.',
3079:'.min(Integer::compareTo); // Find the minimum.',3083:'.max(Integer::compareTo); // Find the maximum.',
3090:'- **Purpose**: Count the elements in the stream.',3091:'- **Return type**: `long`.',3092:'- **Functional interface**: None required.',3099:'.count(); // Count elements.',
3106:'- **Purpose**: Check whether any element matches the predicate.',3107:'- **Return type**: `boolean`; true if at least one element matches.',3108:'- **Functional interface**: `Predicate<T>` tests each relevant element.',3115:'.anyMatch(n -> n % 2 == 0); // Check for an even number.',
3122:'- **Purpose**: Check whether all elements match the predicate.',3123:'- **Return type**: `boolean`; true when all elements match, including an empty stream.',3124:'- **Functional interface**: `Predicate<T>` supplies the condition.',3131:'.allMatch(n -> n % 2 == 0); // Check whether all numbers are even.',
3138:'- **Purpose**: Check whether no element matches the predicate.',3139:'- **Return type**: `boolean`; true when no element matches.',3140:'- **Functional interface**: `Predicate<T>` supplies the condition.',3147:'.noneMatch(n -> n % 2 != 0); // Check that no number is odd.',
3152:'### 10. `findFirst()` and `findAny()`',3154:'- **Purpose**: Find the first element in encounter order, or any available element. findAny is nondeterministic and can be useful in parallel pipelines.',3155:'- **Return type**: `Optional<T>`.',3156:'- **Functional interface**: None required.',3163:'.findFirst(); // Find the first element.',3167:'.findAny(); // Find any element.',3168:'System.out.println(any.orElse(-1)); // May vary, particularly for parallel streams.',
3172:'### Summary',3174:'- `forEach()`, `toArray()`, `reduce()`, and `collect()` process elements and produce results.',3175:'- `min()`, `max()`, `count()`, `anyMatch()`, `allMatch()`, and `noneMatch()` aggregate values or evaluate conditions.',3176:'- `findFirst()` and `findAny()` retrieve an element.',3177:'- Relevant functional interfaces include `Consumer<T>`, `Predicate<T>`, `Function<T, R>`, and `BinaryOperator<T>`.'
}
for n in [3011,3026,3042,3058,3074,3094,3110,3126,3142,3158]:translations[n]='**Example**:'
def translate(text):
    lines=text.splitlines()
    for n,t in translations.items():
        indent=re.match(r'^\s*',lines[n-1])[0];lines[n-1]=indent+t
    result='\n'.join(lines)
    assert not re.search(r'[\u4e00-\u9fff]',result),'Missing English translation'
    return result
