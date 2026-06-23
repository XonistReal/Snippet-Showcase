import type { SeedSnippet } from './types.js'

/**
 * The starter reel. With the execution engine in place, everything except CSS
 * is runnable on the server (CSS gets a live visual preview in the client).
 */
export const seedSnippets: SeedSnippet[] = [
  {
    id: 'range-one-liner',
    title: 'Range in one line',
    blurb: 'Build [0..n) without a loop in sight.',
    language: 'javascript',
    author: '@arraywizard',
    baseVotes: 1243,
    tags: ['arrays', 'one-liner', 'functional'],
    runnable: true,
    accent: '#7c5cff',
    code: `const range = (n) => [...Array(n).keys()];

console.log(range(8));
// [0, 1, 2, 3, 4, 5, 6, 7]`,
  },
  {
    id: 'debounce',
    title: 'Tiny debounce',
    blurb: 'Stop spamming that handler in 4 lines.',
    language: 'javascript',
    author: '@eventloop',
    baseVotes: 2087,
    tags: ['timing', 'events', 'utility'],
    runnable: true,
    accent: '#ff5c8a',
    code: `const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const log = debounce(() => console.log('fired!'), 100);
log(); log(); log(); // only one "fired!" after 100ms`,
  },
  {
    id: 'group-by',
    title: 'groupBy without lodash',
    blurb: 'Bucket any list by a key picker.',
    language: 'javascript',
    author: '@reducepro',
    baseVotes: 1762,
    tags: ['arrays', 'reduce', 'functional'],
    runnable: true,
    accent: '#22c1c3',
    code: `const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    (acc[key(item)] ??= []).push(item);
    return acc;
  }, {});

const pets = [
  { type: 'cat', name: 'Lua' },
  { type: 'dog', name: 'Rex' },
  { type: 'cat', name: 'Mimi' },
];

console.log(groupBy(pets, (p) => p.type));`,
  },
  {
    id: 'fizzbuzz-elegant',
    title: 'FizzBuzz, but pretty',
    blurb: 'No nested ifs — just string math.',
    language: 'javascript',
    author: '@cleancoder',
    baseVotes: 944,
    tags: ['classic', 'one-liner'],
    runnable: true,
    accent: '#f7b733',
    code: `for (let i = 1; i <= 15; i++) {
  console.log(
    (i % 3 ? '' : 'Fizz') + (i % 5 ? '' : 'Buzz') || i
  );
}`,
  },
  {
    id: 'shuffle',
    title: 'Fisher–Yates shuffle',
    blurb: 'Provably fair array shuffling.',
    language: 'javascript',
    author: '@randomgen',
    baseVotes: 1356,
    tags: ['arrays', 'algorithms'],
    runnable: true,
    accent: '#36d1dc',
    code: `const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

console.log(shuffle([1, 2, 3, 4, 5, 6, 7]));`,
  },
  {
    id: 'memoize',
    title: 'One-line memoize',
    blurb: 'Cache pure functions with a Map.',
    language: 'javascript',
    author: '@cachemoney',
    baseVotes: 1899,
    tags: ['performance', 'functional'],
    runnable: true,
    accent: '#a17fe0',
    code: `const memoize = (fn, cache = new Map()) => (...args) => {
  const k = JSON.stringify(args);
  if (!cache.has(k)) cache.set(k, fn(...args));
  return cache.get(k);
};

const slowSquare = (n) => (console.log('computing', n), n * n);
const fast = memoize(slowSquare);
fast(9); fast(9); // "computing 9" prints once
console.log(fast(9));`,
  },
  {
    id: 'pipe',
    title: 'Function pipe',
    blurb: 'Left-to-right composition, zero deps.',
    language: 'javascript',
    author: '@composeher',
    baseVotes: 1521,
    tags: ['functional', 'composition'],
    runnable: true,
    accent: '#ff6a88',
    code: `const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const clean = pipe(
  (s) => s.trim(),
  (s) => s.toLowerCase(),
  (s) => s.replace(/\\s+/g, '-')
);

console.log(clean('  Hello World From Pipe  '));`,
  },
  {
    id: 'unique',
    title: 'Dedupe with a Set',
    blurb: 'Unique values, instantly.',
    language: 'javascript',
    author: '@setlife',
    baseVotes: 1102,
    tags: ['arrays', 'one-liner'],
    runnable: true,
    accent: '#11998e',
    code: `const unique = (arr) => [...new Set(arr)];

console.log(unique([1, 1, 2, 3, 3, 3, 4, 'a', 'a']));`,
  },
  {
    id: 'sleep',
    title: 'async sleep',
    blurb: 'await a pause like it is nothing.',
    language: 'javascript',
    author: '@asyncadam',
    baseVotes: 1330,
    tags: ['async', 'timing'],
    runnable: true,
    accent: '#fc5c7d',
    code: `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log('start');
  await sleep(120);
  console.log('...120ms later');
})();`,
  },
  {
    id: 'flatten-deep',
    title: 'Deep flatten',
    blurb: 'Recursion meets Infinity.',
    language: 'javascript',
    author: '@nesteddoll',
    baseVotes: 876,
    tags: ['arrays', 'recursion'],
    runnable: true,
    accent: '#c471ed',
    code: `const flat = (arr) => arr.flat(Infinity);

console.log(flat([1, [2, [3, [4, [5]]]], 6]));`,
  },
  {
    id: 'py-comprehension',
    title: 'Pythonic primes',
    blurb: 'A sieve that reads like a sentence.',
    language: 'python',
    author: '@snakecharm',
    baseVotes: 1488,
    tags: ['python', 'comprehension', 'math'],
    runnable: true,
    accent: '#3776ab',
    code: `def primes(n):
    sieve = [True] * n
    out = []
    for i in range(2, n):
        if sieve[i]:
            out.append(i)
            for j in range(i * i, n, i):
                sieve[j] = False
    return out

print(primes(30))
# [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]`,
  },
  {
    id: 'py-fib',
    title: 'Fibonacci generator',
    blurb: 'Lazy infinite sequence in 5 lines.',
    language: 'python',
    author: '@genzen',
    baseVotes: 1207,
    tags: ['python', 'generators'],
    runnable: true,
    accent: '#ffce6b',
    code: `def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

from itertools import islice
print(list(islice(fib(), 12)))`,
  },
  {
    id: 'ts-deep-readonly',
    title: 'DeepReadonly<T>',
    blurb: 'Freeze a type, recursively.',
    language: 'typescript',
    author: '@typegolf',
    baseVotes: 1644,
    tags: ['typescript', 'types', 'utility'],
    runnable: true,
    accent: '#3178c6',
    code: `type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

const config = { api: { url: '/v1', retries: 3 } } as const;
const frozen: DeepReadonly<typeof config> = config;
console.log('url =', frozen.api.url, '| retries =', frozen.api.retries);`,
  },
  {
    id: 'css-glass',
    title: 'Glassmorphism card',
    blurb: 'Frosted glass with two declarations.',
    language: 'css',
    author: '@pixelpush',
    baseVotes: 1207,
    tags: ['css', 'design', 'ui'],
    runnable: false,
    accent: '#56ccf2',
    code: `.glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 28px;
  color: #fff;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}`,
  },
  {
    id: 'sql-window',
    title: 'Top N per group',
    blurb: 'Window functions to the rescue.',
    language: 'sql',
    author: '@queryqueen',
    baseVotes: 998,
    tags: ['sql', 'analytics'],
    runnable: true,
    accent: '#e38c00',
    code: `CREATE TABLE products (category TEXT, name TEXT, sales INTEGER);
INSERT INTO products VALUES
  ('fruit','apple',120),('fruit','banana',90),('fruit','cherry',60),
  ('toy','lego',200),('toy','yoyo',40),('toy','kite',150);

SELECT category, name, sales
FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY category ORDER BY sales DESC
  ) AS rn
  FROM products
)
WHERE rn <= 2;`,
  },
  {
    id: 'bash-countdown',
    title: 'Bash countdown',
    blurb: 'Brace expansion + a tiny loop.',
    language: 'bash',
    author: '@shellshock',
    baseVotes: 731,
    tags: ['bash', 'cli'],
    runnable: true,
    accent: '#4eaa25',
    code: `for i in {5..1}; do
  echo "T-minus $i"
done
echo "Liftoff!"`,
  },
]
