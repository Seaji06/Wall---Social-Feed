import Image from "next/image";
import profilePhoto from "@/public/profile.jpg";
import { profile } from "@/lib/profile";

export function Sidebar() {
  return (
    <aside className="border-b border-[#e5e5e5] px-4 py-5 md:border-r md:border-b-0">
      <Image
        src={profilePhoto}
        alt=""
        priority
        className="h-64 w-full rounded-md object-cover object-top md:aspect-[4/5] md:h-auto"
      />
      <h1 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
        {profile.name}
      </h1>
      <p className="text-[15px] text-gray-500">wall</p>

      <div className="mt-4 inline-flex rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700">
        Information
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-semibold text-gray-900">Networks</dt>
          <dd className="text-gray-600">{profile.networks}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-900">Current City</dt>
          <dd className="text-gray-600">{profile.currentCity}</dd>
        </div>
      </dl>
    </aside>
  );
}
