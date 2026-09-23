import { GET as adminGet, POST as adminPost } from '@/app/api/admin/games/route';

export async function GET(req) {
  return adminGet(req);
}

export async function POST(req) {
  return adminPost(req);
}
