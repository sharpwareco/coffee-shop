"use strict";
// CommonJS on purpose: @next/eslint-plugin-next loads fast-glob with require().
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tinyglobby = require("tinyglobby");

// fast-glob does not expand plain directory patterns ("app" stays "app");
// tinyglobby does by default ("app" -> "app/**"), so turn that off.
function withDefaults(options) {
  return { expandDirectories: false, ...options };
}

function stripSlashes(path) {
  return path.replace(/^\.\//, "").replace(/\/+$/, "") || ".";
}

// Leading path segments before the first glob segment: "app/*/x" -> "app".
function staticBase(pattern) {
  const base = [];
  for (const segment of pattern.split("/")) {
    if (tinyglobby.isDynamicPattern(segment)) break;
    base.push(segment);
  }
  return stripSlashes(base.join("/"));
}

// For a dynamic pattern like "app/**", tinyglobby also returns the base
// directory ("app/"); fast-glob does not.
function dropDynamicBases(patterns, results) {
  const bases = new Set(
    [patterns]
      .flat()
      .filter((pattern) => tinyglobby.isDynamicPattern(pattern))
      .map(staticBase),
  );
  return results.filter((result) => !bases.has(stripSlashes(result)));
}

function globSync(patterns, options) {
  return dropDynamicBases(patterns, tinyglobby.globSync(patterns, withDefaults(options)));
}

async function glob(patterns, options) {
  return dropDynamicBases(patterns, await tinyglobby.glob(patterns, withDefaults(options)));
}

module.exports = glob;
module.exports.glob = glob;
module.exports.async = glob;
module.exports.globSync = globSync;
module.exports.sync = globSync;
