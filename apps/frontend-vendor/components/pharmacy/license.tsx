"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formSchema = z.object({
  license_number: z.string().min(1, "許可番号を入力してください"),
  license_expiry: z.string().min(1, "有効期限を入力してください"),
  owner_name: z.string().min(1, "開設者名を入力してください"),
  pharmacist_name: z.string().min(1, "管理薬剤師名を入力してください"),
  pharmacist_license_number: z.string().min(1, "管理薬剤師の免許番号を入力してください"),
  notes: z.string().optional(),
});

type PharmacyLicenseProps = {
  data: any;
};

export function PharmacyLicense({ data }: PharmacyLicenseProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      license_number: data?.license_number || "",
      license_expiry: data?.license_expiry ? new Date(data.license_expiry).toISOString().split("T")[0] : "",
      owner_name: data?.owner_name || "",
      pharmacist_name: data?.pharmacist_name || "",
      pharmacist_license_number: data?.pharmacist_license_number || "",
      notes: data?.license_notes || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("認証エラー");

      const { error } = await supabase
        .from("vendors")
        .update({
          license_number: values.license_number,
          license_expiry: values.license_expiry,
          owner_name: values.owner_name,
          pharmacist_name: values.pharmacist_name,
          pharmacist_license_number: values.pharmacist_license_number,
          license_notes: values.notes,
        })
        .eq("id", session.user.id);

      if (error) throw error;
      toast.success("薬事法関連情報を更新しました");
    } catch (error: any) {
      toast.error("更新に失敗しました");
      console.error("Error updating license info:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="license_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>薬局開設許可番号 *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="license_expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>許可有効期限 *</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="owner_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>開設者名 *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="pharmacist_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>管理薬剤師名 *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pharmacist_license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>管理薬剤師の免許番号 *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>備考</FormLabel>
              <FormDescription>
                その他の薬事法関連情報があれば入力してください
              </FormDescription>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "更新中..." : "保存"}
        </Button>
      </form>
    </Form>
  );
} 