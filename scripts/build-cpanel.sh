#!/usr/bin/env bash
# ==============================================================================
# SIMASPRAS V2 - Skrip Build & Pemaketan Rilis untuk cPanel (Dijalankan di Lokal)
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}      SIMASPRAS V2 - OTOMASI BUILD & PEMAKETAN RILIS CPANEL (LOKAL)           ${NC}"
echo -e "${CYAN}==============================================================================${NC}"

# 1. Generate Prisma Client untuk seluruh target sistem operasi (RHEL + Debian/CloudLinux cPanel)
echo -e "\n${YELLOW}[1/5] Menyiapkan Prisma Client multi-platform...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client berhasil dibuat untuk seluruh binaryTargets.${NC}"

# 2. Kompilasi Next.js Standalone
echo -e "\n${YELLOW}[2/5] Mengompilasi Next.js Standalone Build...${NC}"
npm run build
echo -e "${GREEN}✓ Kompilasi Next.js selesai.${NC}"

# 3. Sinkronisasi aset statis & binary engines ke direktori standalone
echo -e "\n${YELLOW}[3/5] Menyiapkan bundle standalone mandiri...${NC}"
if [ -d "public" ]; then
    cp -r public .next/standalone/
fi

mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/

if [ -f ".env" ]; then
    cp .env .next/standalone/.env
fi

# Pastikan seluruh engine biner Prisma (debian-openssl dkk) tersalin ke standalone node_modules
if [ -d "node_modules/.prisma/client" ] && [ -d ".next/standalone/node_modules/.prisma/client" ]; then
    cp -f node_modules/.prisma/client/*.so.node .next/standalone/node_modules/.prisma/client/ 2>/dev/null || true
    echo -e "${GREEN}✓ Seluruh Prisma Query Engine (.so.node) disinkronkan ke .next/standalone${NC}"
fi

# 4. Buat paket arsip ZIP siap unggah
echo -e "\n${YELLOW}[4/5] Mengompresi paket zip untuk cPanel...${NC}"
# Paket A: next_bundle.zip (hanya folder .next untuk update cepat)
rm -f next_bundle.zip
zip -rq next_bundle.zip .next
echo -e "${GREEN}✓ Paket Cepat (hanya build): next_bundle.zip ($(du -sh next_bundle.zip | cut -f1))${NC}"

# Paket B: simaspras_v2-cpanel.zip (seluruh proyek + build)
rm -f simaspras_v2-cpanel.zip
zip -rq simaspras_v2-cpanel.zip . -x "node_modules/*" ".git/*" "*.zip"
echo -e "${GREEN}✓ Paket Lengkap Proyek: simaspras_v2-cpanel.zip ($(du -sh simaspras_v2-cpanel.zip | cut -f1))${NC}"

echo -e "\n${CYAN}==============================================================================${NC}"
echo -e "${GREEN}✓ PROSES PEMAKETAN SELESAI DENGAN SUKSES!${NC}"
echo -e "File siap unggah:"
echo -e "  1. ${YELLOW}next_bundle.zip${NC}         -> Gunakan untuk update rutin (UI/fitur/API)"
echo -e "  2. ${YELLOW}simaspras_v2-cpanel.zip${NC} -> Gunakan jika ada perubahan dependensi / skema besar"
echo -e "Lihat panduan lengkap di: ${CYAN}prosedur_deploy_cpanel.md${NC}"
echo -e "${CYAN}==============================================================================${NC}\n"
