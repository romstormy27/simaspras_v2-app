#!/usr/bin/env bash
# ==============================================================================
# SIMASPRAS - Politeknik Imigrasi dan Pemasyarakatan Indonesia
# Skrip Otomasi Deployment Standalone & cPanel Phusion Passenger
# FASE 10: TASK-10.2
# ==============================================================================

set -euo pipefail

# ANSI Color Codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}       SIMASPRAS V2 - SKRIP OTOMASI DEPLOYMENT & STANDALONE BUILD             ${NC}"
echo -e "${CYAN}==============================================================================${NC}"

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${DEPLOY_DIR}"

echo -e "\n${YELLOW}[1/6] Memeriksa Lingkungan Node.js & Dependensi Sistem...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js tidak terdeteksi di PATH! Pastikan Node.js v18/v20 terinstall.${NC}"
    exit 1
fi

NODE_VER=$(node -v)
NPM_VER=$(npm -v)
echo -e "✓ Node.js Version : ${GREEN}${NODE_VER}${NC}"
echo -e "✓ NPM Version     : ${GREEN}${NPM_VER}${NC}"
echo -e "✓ Direktori Rilis : ${GREEN}${DEPLOY_DIR}${NC}"

# Validasi file .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[PERINGATAN] File .env tidak ditemukan! Menggunakan .env.example jika ada...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Berhasil menyalin .env.example ke .env${NC}"
    else
        echo -e "${RED}[ERROR] Silakan sediakan file .env dengan variabel DATABASE_URL dan JWT_SECRET!${NC}"
        exit 1
    fi
fi

echo -e "\n${YELLOW}[2/6] Menginstal Dependensi NPM...${NC}"
npm install --production=false --no-audit --prefer-offline || npm install --production=false
echo -e "${GREEN}✓ Dependensi selesai diinstal.${NC}"

echo -e "\n${YELLOW}[3/6] Menyiapkan Skema Database Prisma...${NC}"
npx prisma generate
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    echo -e "Menerapkan migrasi database via 'prisma migrate deploy'..."
    npx prisma migrate deploy
else
    echo -e "Sinkronisasi skema database via 'prisma db push'..."
    npx prisma db push --skip-generate
fi
echo -e "${GREEN}✓ Skema Prisma database berhasil disinkronkan.${NC}"

echo -e "\n${YELLOW}[4/6] Memeriksa & Menyiapkan Bundle Produksi Standalone Next.js...${NC}"
if [ -f ".next/standalone/server.js" ] && [ -d ".next/static" ]; then
    echo -e "${GREEN}✓ Bundle produksi pre-built (.next/standalone) sudah tersedia.${NC}"
    echo -e "  Melewati kompilasi ulang (skip build) untuk mencegah limit proses CloudLinux cPanel (EAGAIN)."
    echo -e "  (Jika ingin memaksa kompilasi ulang, hapus folder .next/ lalu jalankan kembali skrip ini)"
else
    echo -e "Menjalankan kompilasi Next.js Standalone (mode hemat proses CloudLinux)..."
    NODE_OPTIONS="--max-old-space-size=1024" npm run build
    echo -e "${GREEN}✓ Next.js Standalone build berhasil diselesaikan.${NC}"
fi

echo -e "\n${YELLOW}[5/6] Menyalin Aset Statis ke Direktori Standalone...${NC}"
if [ -d ".next/standalone" ]; then
    # Salin public folder jika ada
    if [ -d "public" ]; then
        cp -r public .next/standalone/
        echo -e "✓ Folder 'public' berhasil disalin ke .next/standalone/"
    fi

    # Salin static folder Next.js
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/
    echo -e "✓ Folder '.next/static' berhasil disalin ke .next/standalone/.next/"

    # Salin file environment jika diperlukan
    if [ -f ".env" ]; then
        cp .env .next/standalone/.env
        echo -e "✓ File .env disalin ke .next/standalone/.env"
    fi

    # Salin Prisma Query Engines ke standalone bundle agar kompatibel dengan lingkungan cPanel
    if [ -d "node_modules/.prisma/client" ] && [ -d ".next/standalone/node_modules/.prisma/client" ]; then
        cp -f node_modules/.prisma/client/*.so.node .next/standalone/node_modules/.prisma/client/ 2>/dev/null || true
        echo -e "✓ Prisma Query Engines berhasil disinkronkan ke .next/standalone"
    fi
else
    echo -e "${RED}[ERROR] Folder .next/standalone tidak ditemukan. Periksa next.config.mjs 'output: standalone'.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}[6/6] Memperbarui Signal Restart Passenger cPanel...${NC}"
mkdir -p tmp
touch tmp/restart.txt
echo -e "${GREEN}✓ File tmp/restart.txt berhasil diperbarui.${NC}"

echo -e "\n${CYAN}==============================================================================${NC}"
echo -e "${GREEN}✓ DEPLOYMENT SUKSES! Aplikasi SIMASPRAS siap dijalankan.${NC}"
echo -e "  Untuk menjalankan server secara mandiri:"
echo -e "    ${YELLOW}npm start${NC}  atau  ${YELLOW}node server.js${NC}"
echo -e "  Di cPanel Phusion Passenger: Server otomatis me-reload via tmp/restart.txt"
echo -e "${CYAN}==============================================================================${NC}\n"
