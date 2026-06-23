import type { Snippet } from '../types'

/**
 * A curated reel of short, clever snippets. JavaScript entries are runnable in
 * the in-app sandbox; others are view + fork only.
 */
export const snippets: Snippet[] = [
  {
    id: 'range-one-liner',
    title: 'Range in one line',
    blurb: 'Build [0..n) without a loop in sight.',
    language: 'javascript',
    author: '@arraywizard',
    votes: 1243,
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
    votes: 2087,
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
    votes: 1762,
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
    votes: 944,
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
    votes: 1356,
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
    votes: 1899,
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
    votes: 1521,
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
    votes: 1102,
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
    votes: 1330,
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
    votes: 876,
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
    votes: 1488,
    tags: ['python', 'comprehension', 'math'],
    runnable: false,
    accent: '#3776ab',
    code: `def primes(n):
    sieve = [True] * n
    return [
        i for i in range(2, n)
        if sieve[i] and not any(
            sieve.__setitem__(j, False)
            for j in range(i * i, n, i)
        )
    ]

print(primes(30))
# [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]`,
  },
  {
    id: 'ts-deep-readonly',
    title: 'DeepReadonly<T>',
    blurb: 'Freeze a type, recursively.',
    language: 'typescript',
    author: '@typegolf',
    votes: 1644,
    tags: ['typescript', 'types', 'utility'],
    runnable: false,
    accent: '#3178c6',
    code: `type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

type Config = DeepReadonly<{
  api: { url: string; retries: number };
}>;
// config.api.url is now read-only, all the way down`,
  },
  {
    id: 'css-glass',
    title: 'Glassmorphism card',
    blurb: 'Frosted glass with two declarations.',
    language: 'css',
    author: '@pixelpush',
    votes: 1207,
    tags: ['css', 'design', 'ui'],
    runnable: false,
    accent: '#56ccf2',
    code: `.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
}`,
  },
  {
    id: 'sql-window',
    title: 'Top N per group',
    blurb: 'Window functions to the rescue.',
    language: 'sql',
    author: '@queryqueen',
    votes: 998,
    tags: ['sql', 'analytics'],
    runnable: false,
    accent: '#e38c00',
    code: `SELECT *
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY category
      ORDER BY sales DESC
    ) AS rn
  FROM products
) ranked
WHERE rn <= 3;`,
  },
  {
    id: 'bash-extract',
    title: 'Universal extractor',
    blurb: 'One function, every archive format.',
    language: 'bash',
    author: '@shellshock',
    votes: 731,
    tags: ['bash', 'cli', 'utility'],
    runnable: false,
    accent: '#4eaa25',
    code: `extract() {
  case "$1" in
    *.tar.gz|*.tgz) tar xzf "$1" ;;
    *.tar.bz2)      tar xjf "$1" ;;
    *.zip)          unzip "$1"   ;;
    *.gz)           gunzip "$1"  ;;
    *) echo "Unknown format: $1" ;;
  esac
}`,
  },
]
