#!/usr/bin/env python3
"""
compile_to_md.py
Compiles all source files from a Next.js project into a single Markdown file
for use as AI context (agentic/RAG workflows).

Usage:
    python compile_to_md.py [project_root] [output_file]

Defaults:
    project_root  →  current working directory
    output_file   →  context.md
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# File extensions to include
INCLUDE_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx",   # TypeScript / JavaScript
    ".css", ".scss", ".sass",        # Styles
    ".json",                          # Config / data
    ".md", ".mdx",                    # Markdown / MDX pages
    ".env.example",                   # Env templates (never .env itself)
    ".graphql", ".gql",              # GraphQL schemas/queries
    ".sql",                           # SQL files
    ".yaml", ".yml",                 # YAML configs
    ".prisma",                        # Prisma schema
    ".toml",                          # TOML configs (e.g. Cargo, pyproject)
}

# Directories to skip entirely
SKIP_DIRS = {
    "node_modules", ".next", ".git", "dist", "build",
    ".turbo", ".cache", "coverage", "__pycache__", ".vercel",
    "out", ".swc", "storybook-static",
}

# Files to skip by exact name
SKIP_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    ".DS_Store", "Thumbs.db",
}

# Roots to scan (relative to project root). Add more if needed.
SCAN_ROOTS = ["src", "app", "pages", "components", "lib", "utils", "hooks",
              "styles", "types", "prisma", "public"]

# Language map for fenced code blocks
LANG_MAP = {
    ".ts":      "typescript",
    ".tsx":     "tsx",
    ".js":      "javascript",
    ".jsx":     "jsx",
    ".css":     "css",
    ".scss":    "scss",
    ".sass":    "sass",
    ".json":    "json",
    ".md":      "markdown",
    ".mdx":     "mdx",
    ".graphql": "graphql",
    ".gql":     "graphql",
    ".sql":     "sql",
    ".yaml":    "yaml",
    ".yml":     "yaml",
    ".prisma":  "prisma",
    ".toml":    "toml",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_lang(path: Path) -> str:
    suffix = path.suffix.lower()
    return LANG_MAP.get(suffix, "")


def should_include(path: Path) -> bool:
    """Return True if this file should be included in the output."""
    if path.name in SKIP_FILES:
        return False
    # Handle compound extensions like .env.example
    name_lower = path.name.lower()
    for ext in INCLUDE_EXTENSIONS:
        if name_lower.endswith(ext):
            return True
    return False


def collect_files(project_root: Path) -> list[Path]:
    """Collect all files to include, sorted by relative path."""
    collected: list[Path] = []

    # Determine which top-level dirs to scan
    roots_to_scan: list[Path] = []
    for root_name in SCAN_ROOTS:
        candidate = project_root / root_name
        if candidate.is_dir():
            roots_to_scan.append(candidate)

    # Fallback: if none of the expected dirs exist, scan the whole project root
    if not roots_to_scan:
        roots_to_scan = [project_root]

    for root in roots_to_scan:
        for dirpath, dirnames, filenames in os.walk(root):
            # Prune skipped dirs in-place so os.walk doesn't descend into them
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fname in filenames:
                fpath = Path(dirpath) / fname
                if should_include(fpath):
                    collected.append(fpath)

    # Deduplicate and sort
    seen: set[Path] = set()
    unique: list[Path] = []
    for p in sorted(collected, key=lambda x: str(x).lower()):
        if p not in seen:
            seen.add(p)
            unique.append(p)
    return unique


def file_size_kb(path: Path) -> float:
    try:
        return path.stat().st_size / 1024
    except OSError:
        return 0.0


def build_tree(files: list[Path], project_root: Path) -> str:
    """Build a simple directory-tree string from the collected files."""
    lines: list[str] = [f"{project_root.name}/"]
    seen_dirs: set[Path] = set()
    for fpath in files:
        rel = fpath.relative_to(project_root)
        parts = rel.parts
        for depth in range(len(parts) - 1):
            dir_path = project_root.joinpath(*parts[: depth + 1])
            if dir_path not in seen_dirs:
                indent = "    " * depth + "├── "
                lines.append(f"{indent}{parts[depth]}/")
                seen_dirs.add(dir_path)
        indent = "    " * (len(parts) - 1) + "└── "
        lines.append(f"{indent}{parts[-1]}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def compile_context(project_root: Path, output_file: Path, max_file_kb: float = 500) -> None:
    print(f"🔍  Scanning: {project_root}")
    files = collect_files(project_root)

    if not files:
        print("⚠️   No source files found. Check SCAN_ROOTS and INCLUDE_EXTENSIONS.")
        sys.exit(1)

    print(f"📄  Found {len(files)} file(s). Writing → {output_file}")

    with output_file.open("w", encoding="utf-8") as out:
        # ── Header ──────────────────────────────────────────────────────────
        out.write(f"# Project Context: `{project_root.name}`\n\n")
        out.write(f"> Generated by `compile_to_md.py` on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        out.write("---\n\n")

        # ── File tree ────────────────────────────────────────────────────────
        out.write("## File Tree\n\n")
        out.write("```\n")
        out.write(build_tree(files, project_root))
        out.write("\n```\n\n")
        out.write("---\n\n")

        # ── File index ───────────────────────────────────────────────────────
        out.write("## File Index\n\n")
        for i, fpath in enumerate(files, 1):
            rel = fpath.relative_to(project_root)
            out.write(f"{i}. `{rel}`\n")
        out.write("\n---\n\n")

        # ── File contents ────────────────────────────────────────────────────
        out.write("## Source Files\n\n")
        skipped = 0
        for fpath in files:
            rel = fpath.relative_to(project_root)
            size_kb = file_size_kb(fpath)

            out.write(f"### `{rel}`\n\n")

            if size_kb > max_file_kb:
                out.write(f"> ⚠️ File skipped (size {size_kb:.1f} KB > limit {max_file_kb} KB)\n\n")
                skipped += 1
                continue

            try:
                content = fpath.read_text(encoding="utf-8", errors="replace")
            except OSError as exc:
                out.write(f"> ❌ Could not read file: {exc}\n\n")
                skipped += 1
                continue

            lang = get_lang(fpath)
            out.write(f"```{lang}\n")
            # Escape any closing fences inside the content
            content = content.replace("```", "` ` `")
            out.write(content)
            if not content.endswith("\n"):
                out.write("\n")
            out.write("```\n\n")

    total_kb = output_file.stat().st_size / 1024
    total_mb = total_kb / 1024
    print(f"\n✅  Done!")
    print(f"    Files included : {len(files) - skipped}")
    print(f"    Files skipped  : {skipped}")
    print(f"    Output size    : {total_mb:.2f} MB  ({total_kb:.0f} KB)")
    print(f"    Output path    : {output_file.resolve()}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compile Next.js source files into a single Markdown context file."
    )
    parser.add_argument(
        "project_root",
        nargs="?",
        default=".",
        help="Path to the Next.js project root (default: current directory)",
    )
    parser.add_argument(
        "output_file",
        nargs="?",
        default="context.md",
        help="Output Markdown file path (default: context.md)",
    )
    parser.add_argument(
        "--max-kb",
        type=float,
        default=500,
        metavar="KB",
        help="Skip individual files larger than this many KB (default: 500)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    project_root = Path(args.project_root).resolve()
    output_file = Path(args.output_file).resolve()

    if not project_root.is_dir():
        print(f"❌  Project root not found: {project_root}")
        sys.exit(1)

    compile_context(project_root, output_file, max_file_kb=args.max_kb)
