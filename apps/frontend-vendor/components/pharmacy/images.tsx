"use client";

import { useState } from "react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type PharmacyImagesProps = {
  data: any;
};

export function PharmacyImages({ data }: PharmacyImagesProps) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(data?.images || []);
  const supabase = createClientComponentClient();

  const uploadImage = async (file: File) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("認証エラー");

      const fileExt = file.name.split(".").pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("pharmacy-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("pharmacy-images")
        .getPublicUrl(fileName);

      const newImages = [...images, publicUrl];
      const { error: updateError } = await supabase
        .from("vendors")
        .update({ images: newImages })
        .eq("id", session.user.id);

      if (updateError) throw updateError;

      setImages(newImages);
      toast.success("画像をアップロードしました");
    } catch (error: any) {
      toast.error("アップロードに失敗しました");
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("認証エラー");

      const fileName = imageUrl.split("/").pop();
      const { error: deleteError } = await supabase.storage
        .from("pharmacy-images")
        .remove([`${session.user.id}/${fileName}`]);

      if (deleteError) throw deleteError;

      const newImages = images.filter(img => img !== imageUrl);
      const { error: updateError } = await supabase
        .from("vendors")
        .update({ images: newImages })
        .eq("id", session.user.id);

      if (updateError) throw updateError;

      setImages(newImages);
      toast.success("画像を削除しました");
    } catch (error: any) {
      toast.error("削除に失敗しました");
      console.error("Error deleting image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ファイルサイズは5MB以下にしてください");
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("JPEGまたはPNG形式の画像を選択してください");
      return;
    }

    uploadImage(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          disabled={loading}
        />
        <p className="text-sm text-gray-500">
          最大5MB、JPEG/PNG形式
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <div className="aspect-video relative">
              <Image
                src={imageUrl}
                alt={`店舗画像 ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteImage(imageUrl)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <p className="text-center text-gray-500">
          店舗画像がありません
        </p>
      )}
    </div>
  );
} 