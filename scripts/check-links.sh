#!/usr/bin/env bash
# Защита от подмены ссылок и подключения чужого кода. Запуск: bash scripts/check-links.sh
# Работает локально (Git Bash) и в GitHub Actions (.github/workflows/check-links.yml).
#
# Проверяет все отслеживаемые HTML/JS/JSON/CSS/SVG/YAML-файлы:
#   1. каждый адрес http(s)://… ведёт на домен из scripts/allowed-domains.txt;
#   2. нет незашифрованных http:// (кроме технических пространств имён);
#   3. в адресах нет приёма «userinfo@» (https://t.me@evil.com — это evil.com);
#   4. в коде нет eval(), new Function() и document.write().
# sitemap.xml исключён: там временные адреса-заглушки до запуска на своём домене.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

ALLOWED=$(grep -vE '^\s*(#|$)' scripts/allowed-domains.txt | sed -E 's/\s*#.*$//' | tr -d '\r')
problems=0

fail() {
  echo "::error::$1"
  problems=$((problems + 1))
}

host_of() {
  local u=${1#*://}
  u=${u%%[/?#]*}
  u=${u##*@}
  u=${u%%:*}
  echo "$u" | tr 'A-Z' 'a-z'
}

is_allowed() {
  local h=$1 d
  while IFS= read -r d; do
    [ -z "$d" ] && continue
    if [ "$h" = "$d" ] || [[ "$h" == *".$d" ]]; then return 0; fi
  done <<<"$ALLOWED"
  return 1
}

FILES=$(git ls-files | grep -E '\.(html|js|mjs|json|css|svg|yml|yaml)$' | grep -vE '^(\.claude/|vercel\.json$)')

# 1–3: все адреса в файлах
while IFS= read -r file; do
  while IFS= read -r url; do
    [ -z "$url" ] && continue
    url=${url%%[\"\'\`\)\<\>\ ,;]*}
    rest=${url#*://}
    if [[ "${rest%%[/?#]*}" == *@* ]]; then
      fail "$file: адрес с «@» в домене (маскировка): $url"
      continue
    fi
    host=$(host_of "$url")
    if ! is_allowed "$host"; then
      fail "$file: домен $host не в scripts/allowed-domains.txt ($url)"
      continue
    fi
    case "$url" in
      http://*) case "$host" in w3.org|www.w3.org|sitemaps.org|www.sitemaps.org) ;; *) fail "$file: небезопасный http:// адрес: $url" ;; esac ;;
    esac
  done < <(grep -ohE "https?://[^\"'\`<> )]+" "$file" | sort -u)
done <<<"$FILES"

# 4: опасные конструкции в коде
if dangerous=$(git ls-files 'assets/js/*.js' 'scripts/*.mjs' | xargs grep -nE '\beval\(|new Function\(|document\.write\(' 2>/dev/null); then
  fail "опасная конструкция в коде:
$dangerous"
fi

if [ "$problems" -gt 0 ]; then
  echo "Проверка ссылок: проблем — $problems"
  exit 1
fi
echo "Проверка ссылок: всё чисто ($(echo "$FILES" | wc -l | tr -d ' ') файлов, $(echo "$ALLOWED" | wc -l | tr -d ' ') разрешённых доменов)"
