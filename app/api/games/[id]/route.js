import {
  GET as adminGet,
  PUT as adminPut,
  DELETE as adminDelete,
} from '@/app/api/admin/games/[eventId]/route';

export async function GET(request, context) {
  return adminGet(request, context);
}

export async function PUT(request, context) {
  return adminPut(request, context);
}

export async function DELETE(request, context) {
  return adminDelete(request, context);
}
