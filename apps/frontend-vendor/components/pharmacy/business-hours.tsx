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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

const daySchema = z.object({
  isOpen: z.boolean(),
  openTime: z.string().regex(timePattern, "正しい時刻形式で入力してください (HH:MM)"),
  closeTime: z.string().regex(timePattern, "正しい時刻形式で入力してください (HH:MM)"),
});

const formSchema = z.object({
  business_hours: z.object({
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema,
    holiday: daySchema,
  }),
});

const defaultDay = {
  isOpen: true,
  openTime: "09:00",
  closeTime: "18:00",
};

type PharmacyBusinessHoursProps = {
  data: any;
};

export function PharmacyBusinessHours({ data }: PharmacyBusinessHoursProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_hours: data?.business_hours || {
        monday: defaultDay,
        tuesday: defaultDay,
        wednesday: defaultDay,
        thursday: defaultDay,
        friday: defaultDay,
        saturday: defaultDay,
        sunday: defaultDay,
        holiday: defaultDay,
      },
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("認証エラー");

      const { error } = await supabase
        .from("vendors")
        .update({ business_hours: values.business_hours })
        .eq("id", session.user.id);

      if (error) throw error;
      toast.success("営業時間を更新しました");
    } catch (error: any) {
      toast.error("更新に失敗しました");
      console.error("Error updating business hours:", error);
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { key: "monday", label: "月曜日" },
    { key: "tuesday", label: "火曜日" },
    { key: "wednesday", label: "水曜日" },
    { key: "thursday", label: "木曜日" },
    { key: "friday", label: "金曜日" },
    { key: "saturday", label: "土曜日" },
    { key: "sunday", label: "日曜日" },
    { key: "holiday", label: "祝日" },
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.key} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-24">
                <span className="font-medium">{day.label}</span>
              </div>

              <FormField
                control={form.control}
                name={`business_hours.${day.key}.isOpen`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span>{field.value ? "営業" : "休業"}</span>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch(`business_hours.${day.key}.isOpen`) && (
                <>
                  <FormField
                    control={form.control}
                    name={`business_hours.${day.key}.openTime`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            className="w-32"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <span>〜</span>

                  <FormField
                    control={form.control}
                    name={`business_hours.${day.key}.closeTime`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            className="w-32"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "更新中..." : "保存"}
        </Button>
      </form>
    </Form>
  );
} 