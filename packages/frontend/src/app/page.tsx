export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfcfb] to-[#f5f3ed]">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-[#4a4a4a] mb-4">Adria Cross</h1>
        <p className="text-xl text-[#c19a5d] mb-8">
          Professional Personal Stylist
        </p>
        <p className="text-lg text-[#4a4a4a] max-w-2xl">
          Welcome to the new Adria Cross website. We are currently transforming
          our platform to serve you better with enhanced features and a modern
          experience.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <a
            href="/contact"
            className="px-6 py-3 rounded-full bg-[#c19a5d] text-white font-semibold shadow-md hover:bg-[#ad8648]"
          >
            Contact Adria
          </a>
          <a
            href="/forms"
            className="px-6 py-3 rounded-full border border-[#c19a5d] text-[#4a4a4a] font-semibold hover:bg-[#f5f3ed]"
          >
            Intake Forms
          </a>
          <a
            href="/admin/inquiries"
            className="px-6 py-3 rounded-full border border-[#c19a5d] text-[#4a4a4a] font-semibold hover:bg-[#f5f3ed]"
          >
            Admin Inquiries
          </a>
        </div>
        <div className="mt-6 text-sm text-gray-600">
          <p>Next.js Frontend | Express Backend | PostgreSQL Database</p>
        </div>
      </div>
    </main>
  );
}
