"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteMember } from "@/app/(dashboard)/members/actions";
import { Trash2 } from "lucide-react";

interface DeleteMemberButtonProps {
  memberId: string;
  memberName: string;
  isSelf?: boolean;
  isLastAdmin?: boolean;
}

export function DeleteMemberButton({
  memberId,
  memberName,
  isSelf = false,
  isLastAdmin = false,
}: DeleteMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const disabled = isSelf || isLastAdmin;
  const tooltip = isSelf
    ? "不能删除自己的账号"
    : isLastAdmin
      ? "团队必须至少保留一名管理员"
      : undefined;

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const result = await deleteMember(memberId);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "删除失败");
      }
    } catch {
      setError("删除失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={disabled}
          title={tooltip}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">删除 {memberName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要删除成员「{memberName}」吗？此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}