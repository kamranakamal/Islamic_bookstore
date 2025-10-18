import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import { BlogManager } from "@/components/admin/BlogManager";
import { getAdminBlogPosts } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts();
  const queryClient = new QueryClient();
  queryClient.setQueryData(["admin-blog"], posts);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Manage blog posts</h1>
        <p className="text-sm text-gray-600">
          Publish reflections, announcements, and articles that appear on the public blog.
        </p>
      </header>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BlogManager posts={posts} />
      </HydrationBoundary>
    </div>
  );
}
