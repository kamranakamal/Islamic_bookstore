export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-gray-500">
        <p>Books curated from the Qur’an, authentic Sunnah, and the Salaf — verified sources, accessible knowledge.</p>
        <p className="text-xs">© {new Date().getFullYear()} Maktab Muhammadiya. All rights reserved.</p>
      </div>
    </footer>
  );
}
