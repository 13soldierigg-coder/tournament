import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
      <h1 className="text-6xl font-black text-cyan-400 mb-4">404</h1>
      <h2 className="text-xl font-bold text-slate-200 mb-2">Trang không tồn tại / Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        Đường dẫn bạn yêu cầu không tìm thấy hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-colors"
      >
        Về Trang Chủ / Return Home
      </Link>
    </div>
  );
}
