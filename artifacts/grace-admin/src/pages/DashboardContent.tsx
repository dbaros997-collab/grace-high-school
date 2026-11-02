import { ContentSection, type FieldDef } from "@/components/ContentSection";
import { ResourcesSection } from "@/components/ResourcesSection";
import { SubmissionsSection } from "@/components/SubmissionsSection";
import { ApplicationsSection } from "@/components/ApplicationsSection";
import { SiteTextSection } from "@/components/SiteTextSection";
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

const newsFields: FieldDef[] = [
  { key: "message", label: "Message", type: "textarea", required: true },
];
const statsFields: FieldDef[] = [
  { key: "value", label: "Value", type: "text", required: true, placeholder: "28" },
  { key: "label", label: "Label", type: "text", required: true, placeholder: "Acre Campus" },
];
const galleryFields: FieldDef[] = [
  { key: "caption", label: "Caption", type: "text", required: true },
  {
    key: "category",
    label: "Category",
    type: "text",
    placeholder: "campus / academics / events / vocational / achievements",
  },
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

export function DashboardContent({ section }: { section: string }) {
  const news = useListNewsItems(adminParams);
  const newsCreate = useCreateNewsItem();
  const newsUpdate = useUpdateNewsItem();
  const newsDelete = useDeleteNewsItem();
  const newsReorder = useReorderNewsItems();

  const gallery = useListGalleryImages(adminParams);
  const galleryCreate = useCreateGalleryImage();
  const galleryUpdate = useUpdateGalleryImage();
  const galleryDelete = useDeleteGalleryImage();
  const galleryReorder = useReorderGalleryImages();

  const testimonials = useListTestimonials(adminParams);
  const testimonialsCreate = useCreateTestimonial();
  const testimonialsUpdate = useUpdateTestimonial();
  const testimonialsDelete = useDeleteTestimonial();
  const testimonialsReorder = useReorderTestimonials();

  const videos = useListVideos(adminParams);
  const videosCreate = useCreateVideo();
  const videosUpdate = useUpdateVideo();
  const videosDelete = useDeleteVideo();
  const videosReorder = useReorderVideos();

  const programmes = useListProgrammes(adminParams);
  const programmesCreate = useCreateProgramme();
  const programmesUpdate = useUpdateProgramme();
  const programmesDelete = useDeleteProgramme();
  const programmesReorder = useReorderProgrammes();

  const stats = useListStats(adminParams);
  const statsCreate = useCreateStat();
  const statsUpdate = useUpdateStat();
  const statsDelete = useDeleteStat();
  const statsReorder = useReorderStats();

  const values = useListSchoolValues(adminParams);
  const valuesCreate = useCreateSchoolValue();
  const valuesUpdate = useUpdateSchoolValue();
  const valuesDelete = useDeleteSchoolValue();
  const valuesReorder = useReorderSchoolValues();

  const admissions = useListAdmissionSteps(adminParams);
  const admissionsCreate = useCreateAdmissionStep();
  const admissionsUpdate = useUpdateAdmissionStep();
  const admissionsDelete = useDeleteAdmissionStep();
  const admissionsReorder = useReorderAdmissionSteps();

  switch (section) {
    case "news":
      return (
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
      );
    case "stats":
      return (
        <ContentSection
          title="Stats Bar"
          description="Headline numbers on the home page."
          fields={statsFields}
          primaryKey="value"
          secondaryKey="label"
          query={stats}
          createMutation={statsCreate}
          updateMutation={statsUpdate}
          deleteMutation={statsDelete}
          reorderMutation={statsReorder}
        />
      );
    case "gallery":
      return (
        <ContentSection
          title="Gallery"
          description="Campus photos — uploads use this site's /api and appear on the public gallery."
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
      );
    case "testimonials":
      return (
        <ContentSection
          title="Testimonials"
          description="Stored for staff; not shown on the public site by default."
          fields={testimonialFields}
          primaryKey="name"
          secondaryKey="role"
          query={testimonials}
          createMutation={testimonialsCreate}
          updateMutation={testimonialsUpdate}
          deleteMutation={testimonialsDelete}
          reorderMutation={testimonialsReorder}
        />
      );
    case "videos":
      return (
        <ContentSection
          title="Videos"
          description="YouTube videos on the public site."
          fields={videoFields}
          primaryKey="title"
          secondaryKey="category"
          query={videos}
          createMutation={videosCreate}
          updateMutation={videosUpdate}
          deleteMutation={videosDelete}
          reorderMutation={videosReorder}
        />
      );
    case "programmes":
      return (
        <ContentSection
          title="Programmes"
          description="Academic programmes and optional images."
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
      );
    case "values":
      return (
        <ContentSection
          title="Core Values"
          description="Values section on the public site."
          fields={valueFields}
          primaryKey="title"
          secondaryKey="description"
          query={values}
          createMutation={valuesCreate}
          updateMutation={valuesUpdate}
          deleteMutation={valuesDelete}
          reorderMutation={valuesReorder}
        />
      );
    case "admissions":
      return (
        <ContentSection
          title="Admission Steps"
          description="Steps shown in the admissions section."
          fields={admissionFields}
          primaryKey="title"
          secondaryKey="description"
          query={admissions}
          createMutation={admissionsCreate}
          updateMutation={admissionsUpdate}
          deleteMutation={admissionsDelete}
          reorderMutation={admissionsReorder}
        />
      );
    case "section-text":
      return <SiteTextSection />;
    case "resources":
      return <ResourcesSection />;
    case "applications":
      return <ApplicationsSection />;
    case "enquiries":
      return (
        <SubmissionsSection
          filterType="enquiry"
          title="Enquiries"
          description="Messages from the public Enquire / Apply form."
          emptyText="No enquiries yet."
          csvPrefix="grace-enquiries"
        />
      );
    default:
      return null;
  }
}
