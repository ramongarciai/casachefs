import { AddonForm } from "../addon-form";

export default function NewAddonPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">New add-on</h1>
      <AddonForm mode="create" defaultValues={{}} />
    </div>
  );
}
