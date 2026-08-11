"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

const GROUPS = [
  {
    id: "group-1",
    name: "第一小组",
    description: "前端开发组",
    color: "border-blue-200 bg-blue-50/50",
    accent: "bg-blue-500",
  },
  {
    id: "group-2",
    name: "第二小组",
    description: "后端开发组",
    color: "border-green-200 bg-green-50/50",
    accent: "bg-green-500",
  },
  {
    id: "group-3",
    name: "第三小组",
    description: "测试与运维组",
    color: "border-purple-200 bg-purple-50/50",
    accent: "bg-purple-500",
  },
];

interface SubmissionState {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
  fileName: string;
  fileSize: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GroupSubmitForm() {
  const [files, setFiles] = useState<Record<string, File | null>>({
    "group-1": null,
    "group-2": null,
    "group-3": null,
  });
  const [states, setStates] = useState<Record<string, SubmissionState>>({
    "group-1": { status: "idle", message: "", fileName: "", fileSize: 0 },
    "group-2": { status: "idle", message: "", fileName: "", fileSize: 0 },
    "group-3": { status: "idle", message: "", fileName: "", fileSize: 0 },
  });
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function handleFileChange(groupId: string, file: File | null) {
    setFiles((prev) => ({ ...prev, [groupId]: file }));
    if (file) {
      setStates((prev) => ({
        ...prev,
        [groupId]: {
          status: "idle",
          message: "",
          fileName: file.name,
          fileSize: file.size,
        },
      }));
    }
  }

  function clearFile(groupId: string) {
    setFiles((prev) => ({ ...prev, [groupId]: null }));
    setStates((prev) => ({
      ...prev,
      [groupId]: { status: "idle", message: "", fileName: "", fileSize: 0 },
    }));
    if (fileInputRefs.current[groupId]) {
      fileInputRefs.current[groupId]!.value = "";
    }
  }

  async function handleSubmit(groupId: string) {
    const file = files[groupId];

    // Validation: must upload a file
    if (!file) {
      setStates((prev) => ({
        ...prev,
        [groupId]: {
          status: "error",
          message: "提交失败：请先选择要上传的文件",
          fileName: "",
          fileSize: 0,
        },
      }));
      return;
    }

    // Validation: file size < 200MB
    if (file.size > MAX_FILE_SIZE) {
      setStates((prev) => ({
        ...prev,
        [groupId]: {
          status: "error",
          message: `提交失败：文件大小 ${formatFileSize(file.size)} 超过 200MB 限制`,
          fileName: file.name,
          fileSize: file.size,
        },
      }));
      return;
    }

    // Simulate upload
    setStates((prev) => ({
      ...prev,
      [groupId]: {
        status: "uploading",
        message: "正在提交...",
        fileName: file.name,
        fileSize: file.size,
      },
    }));

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStates((prev) => ({
      ...prev,
      [groupId]: {
        status: "success",
        message: `提交成功！文件「${file.name}」已上传`,
        fileName: file.name,
        fileSize: file.size,
      },
    }));

    // Clear file after successful submission
    setFiles((prev) => ({ ...prev, [groupId]: null }));
    if (fileInputRefs.current[groupId]) {
      fileInputRefs.current[groupId]!.value = "";
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {GROUPS.map((group) => {
        const state = states[group.id];
        const file = files[group.id];

        return (
          <Card key={group.id} className={`${group.color} border-2`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${group.accent}`} />
                <CardTitle className="text-base font-semibold">{group.name}</CardTitle>
              </div>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* File input area */}
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background/50 px-4 py-6 transition-colors hover:border-muted-foreground/50"
                onClick={() => fileInputRefs.current[group.id]?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) handleFileChange(group.id, droppedFile);
                }}
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">点击或拖拽文件到此处</p>
                <p className="mt-1 text-xs text-muted-foreground">支持任意格式，最大 200MB</p>
                <input
                  ref={(el) => {
                    fileInputRefs.current[group.id] = el;
                  }}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] ?? null;
                    handleFileChange(group.id, selectedFile);
                  }}
                />
              </div>

              {/* Selected file display */}
              {file && (
                <div className="flex items-center gap-2 rounded-md bg-background/80 px-3 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => clearFile(group.id)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="移除文件"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Status message */}
              {state.status === "error" && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{state.message}</span>
                </div>
              )}
              {state.status === "success" && (
                <div className="flex items-start gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{state.message}</span>
                </div>
              )}

              {/* Submit button */}
              <Button
                className="w-full"
                onClick={() => handleSubmit(group.id)}
                disabled={state.status === "uploading"}
              >
                {state.status === "uploading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    提交
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}