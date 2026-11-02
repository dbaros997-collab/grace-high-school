import { ContentSection, type FieldDef } from "@/components/ContentSection";
import { ResourcesSection } from "@/components/ResourcesSection";
import { SubmissionsSection } from "@/components/SubmissionsSection";
import { ApplicationsSection } from "@/components/ApplicationsSection";
import { SiteTextSection } from "@/components/SiteTextSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@workspace/api-client-react";
import {
  useListNewsItems,
  useCreateNewsItem,
  useUpdateNewsItem,
  useDeleteNewsItem,
  useReorderNewsItems,
  useListGalleryImages,
  useCreateGalleryImage,
  useUpdateGalleryImage,
  useDeleteGalleryImage,
  useReorderGalleryImages,
  useListTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
  useReorderTestimonials,
  useListVideos,
  useCreateVideo,
  useUpdateVideo,
  useDeleteVideo,
  useReorderVideos,
  useListProgrammes,
  useCreateProgramme,
  useUpdateProgramme,
  useDeleteProgramme,
  useReorderProgrammes,
  useListStats,
  useCreateStat,
  useUpdateStat,
  useDeleteStat,
  useReorderStats,
  useListSchoolValues,
  useCreateSchoolValue,
  useUpdateSchoolValue,
  useDeleteSchoolValue,
  useReorderSchoolValues,
  useListAdmissionSteps,
  useCreateAdmissionStep,
  useUpdateAdmissionStep,
  useDeleteAdmissionStep,
  useReorderAdmissionSteps,
} from "@workspace/api-client-react";

const adminParams = { includeHidden: true } as const;

const TABS: { value: string; label: string }[] = [
  { value: "news", label: "News Ticker" },
  { value: "stats", label: "Stats" },
  { value: "gallery", label: "Gallery" },
  { value: "testimonials", label: "Testimonials" },
  { value: "videos", label: "Videos" },
  { value: "programmes", label: "Programmes" },
  { value: "values", label: "Values" },
  { value: "admissions", label: "Admission Steps" },
  { value: "section-text", label: "Section Text" },
  { value: "resources", label: "Resources" },
  { value: "applications", label: "Applications" },
  { value: "enquiries", label: "Enquiries" },
];

export default function Dashboard() {
  // News
  const news = useListNewsItems(adminParams);
  const newsCreate = useCreateNewsItem();
  const newsUpdate = useUpdateNewsItem();
  const newsDelete = useDeleteNewsItem();
  const newsReorder = useReorderNewsItems();

  // Gallery
  const gallery = useListGalleryImages(adminParams);
  const galleryCreate = useCreateGalleryImage();
  const galleryUpdate = useUpdateGalleryImage();
  const galleryDelete = useDeleteGalleryImage();
  const galleryReorder = useReorderGalleryImages();

  // Testimonials
  const testimonials = useListTestimonials(adminParams);
  const testimonialsCreate = useCreateTestimonial();
  const testimonialsUpdate = useUpdateTestimonial();
  const testimonialsDelete = useDeleteTestimonial();
  const testimonialsReorder = useReorderTestimonials();

  // Videos
  const videos = useListVideos(adminParams);
  const videosCreate = useCreateVideo();
  const videosUpdate = useUpdateVideo();
  const videosDelete = useDeleteVideo();
  const videosReorder = useReorderVideos();

  // Programmes
  const programmes = useListProgrammes(adminParams);
  const programmesCreate = useCreateProgramme();
  const programmesUpdate = useUpdateProgramme();
  const programmesDelete = useDeleteProgramme();
  const programmesReorder = useReorderProgrammes();

  // Stats
  const stats = useListStats(adminParams);
  const statsCreate = useCreateStat();
  const statsUpdate = useUpdateStat();
  const statsDelete = useDeleteStat();
  const statsReorder = useReorderStats();

  // Values
  const values = useListSchoolValues(adminParams);
  const valuesCreate = useCreateSchoolValue();
  const valuesUpdate = useUpdateSchoolValue();
  const valuesDelete = useDeleteSchoolValue();
  const valuesReorder = useReorderSchoolValues();

  // Admission steps
  const admissions = useListAdmissionSteps(adminParams);
  const admissionsCreate = useCreateAdmissionStep();
  const admissionsUpdate = useUpdateAdmissionStep();
  const admissionsDelete = useDeleteAdmissionStep();
  const admissionsReorder = useReorderAdmissionSteps();

  const newsFields: FieldDef[] = [
    { key: "message", label: "Message", type: "textarea", required: true },
  ];
  const statsFields: FieldDef[] = [
    { key: "value", label: "Value", type: "text", required: true, placeholder: "28" },
    { key: "label", label: "Label", type: "text", required: true, placeholder: "Acre Campus" },
  ];
  const galleryFields: FieldDef[] = [
    { key: "caption", label: "Caption", type: "text", required: true },
    { key: "category", label: "Category", type: "text", placeholder: "campus / academics / events / vocational / achievements" },
    { key: "wide", label: "Wide (spans two columns)", type: "boolean" },
  ];
  const testimonialFields: FieldDef[] = [
    { key: "quote", label: "Quote", type: "textarea", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "role", label: "Role", type: "text" },
    { key: "initials", label: "Initials", type: "text", placeholder: "KH" },
  ];
  const videoFields: FieldDef[] = [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "category", label: "Category", type: "text", placeholder: "Featured" },
    { key: "youtubeId", label: "YouTube ID", type: "text", required: true, placeholder: "c6dBmvv4BLQ" },
  ];
  const programmeFields: FieldDef[] = [
    { key: "tag", label: "Tag", type: "text", placeholder: "S1 – S4" },
    { key: "title", label: "Title", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "subjects", label: "Subjects", type: "tags" },
  ];
  const valueFields: FieldDef[] = [
    { key: "icon", label: "Icon (emoji)", type: "text", placeholder: "✝️" },
    { key: "title", label: "Title", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
  ];
  const admissionFields: FieldDef[] = [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-emerald-900">
              Grace High School — Dashboard (no password)
            </h1>
            <p className="text-xs text-muted-foreground">
              Same server as the public website · saves use{" "}
              <code className="text-[11px]">/api</code> and sync live over SSE
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Open public site ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {news.isError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Cannot sync with the public website</AlertTitle>
            <AlertDescription>
              {news.error instanceof ApiError && news.error.status >= 500
                ? "The server database is not connected. Set DATABASE_URL (and SESSION_SECRET) on Coolify or Render, redeploy, then reload this page. Until then, saves will not appear on gracehighschoolgayaza.academy."
                : "The dashboard could not load content from /api on this domain. Check that the API is running and that your browser allows cookies for this site."}
            </AlertDescription>
          </Alert>
        ) : null}
        <Tabs defaultValue="news">
          <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="news">
            <ContentSection
              title="News Ticker"
              description="Scrolling announcements at the top of the site."
              fields={newsFields}
              primaryKey="message"
              query={news}
              createMutation={newsCreate}
              updateMutation={newsUpdate}
              deleteMutation={newsDelete}
              reorderMutation={newsReorder}
            />
          </TabsContent>

          <TabsContent value="stats">
            <ContentSection
              title="Stats Bar"
              description="The headline numbers shown across the stats bar."
              fields={statsFields}
              primaryKey="value"
              secondaryKey="label"
              query={stats}
              createMutation={statsCreate}
              updateMutation={statsUpdate}
              deleteMutation={statsDelete}
              reorderMutation={statsReorder}
            />
          </TabsContent>

          <TabsContent value="gallery">
            <ContentSection
              title="Gallery"
              description="Campus photos. Upload an image and add a caption."
              fields={galleryFields}
              primaryKey="caption"
              secondaryKey="category"
              query={gallery}
              createMutation={galleryCreate}
              updateMutation={galleryUpdate}
              deleteMutation={galleryDelete}
              reorderMutation={galleryReorder}
              imageUpload
            />
          </TabsContent>

          <TabsContent value="testimonials">
            <ContentSection
              title="Testimonials"
              description="Quotes from students, parents and graduates."
              fields={testimonialFields}
              primaryKey="name"
              secondaryKey="role"
              query={testimonials}
              createMutation={testimonialsCreate}
              updateMutation={testimonialsUpdate}
              deleteMutation={testimonialsDelete}
              reorderMutation={testimonialsReorder}
            />
          </TabsContent>

          <TabsContent value="videos">
            <ContentSection
              title="Videos"
              description="YouTube videos featured on the site."
              fields={videoFields}
              primaryKey="title"
              secondaryKey="category"
              query={videos}
              createMutation={videosCreate}
              updateMutation={videosUpdate}
              deleteMutation={videosDelete}
              reorderMutation={videosReorder}
            />
          </TabsContent>

          <TabsContent value="programmes">
            <ContentSection
              title="Programmes"
              description="Academic programmes and their subjects. Upload an image, or leave it empty to use the default."
              fields={programmeFields}
              primaryKey="title"
              secondaryKey="tag"
              query={programmes}
              createMutation={programmesCreate}
              updateMutation={programmesUpdate}
              deleteMutation={programmesDelete}
              reorderMutation={programmesReorder}
              imageUpload
              imageRequired={false}
            />
          </TabsContent>

          <TabsContent value="values">
            <ContentSection
              title="Values"
              description="The school's core values."
              fields={valueFields}
              primaryKey="title"
              secondaryKey="description"
              query={values}
              createMutation={valuesCreate}
              updateMutation={valuesUpdate}
              deleteMutation={valuesDelete}
              reorderMutation={valuesReorder}
            />
          </TabsContent>

          <TabsContent value="admissions">
            <ContentSection
              title="Admission Steps"
              description="The steps in the admissions process."
              fields={admissionFields}
              primaryKey="title"
              secondaryKey="description"
              query={admissions}
              createMutation={admissionsCreate}
              updateMutation={admissionsUpdate}
              deleteMutation={admissionsDelete}
              reorderMutation={admissionsReorder}
            />
          </TabsContent>

          <TabsContent value="section-text">
            <SiteTextSection />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesSection />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsSection />
          </TabsContent>

          <TabsContent value="enquiries">
            <SubmissionsSection
              filterType="enquiry"
              title="Enquiries"
              description="Messages sent through the “Enquire / Apply Now” form on the website."
              emptyText="No enquiries yet. They will appear here as soon as someone sends a message from the website."
              csvPrefix="grace-enquiries"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
