"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PharmacyBasicInfo } from "@/components/pharmacy/basic-info";
import { PharmacyBusinessHours } from "@/components/pharmacy/business-hours";
import { PharmacyImages } from "@/components/pharmacy/images";
import { PharmacyLicense } from "@/components/pharmacy/license";
import { toast } from "sonner";

export default function PharmacyPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [pharmacyData, setPharmacyData] = useState<any>(null);

  useEffect(() => {
    const fetchPharmacyData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: vendorData, error } = await supabase
          .from("vendors")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;
        setPharmacyData(vendorData);
      } catch (error: any) {
        toast.error("薬局情報の取得に失敗しました");
        console.error("Error fetching pharmacy data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacyData();
  }, [supabase, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">薬局情報管理</h1>
      
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="hours">営業時間</TabsTrigger>
          <TabsTrigger value="images">店舗画像</TabsTrigger>
          <TabsTrigger value="license">薬事法関連</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent>
              <PharmacyBasicInfo data={pharmacyData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>営業時間設定</CardTitle>
            </CardHeader>
            <CardContent>
              <PharmacyBusinessHours data={pharmacyData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>店舗画像管理</CardTitle>
            </CardHeader>
            <CardContent>
              <PharmacyImages data={pharmacyData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="license">
          <Card>
            <CardHeader>
              <CardTitle>薬事法関連情報</CardTitle>
            </CardHeader>
            <CardContent>
              <PharmacyLicense data={pharmacyData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 