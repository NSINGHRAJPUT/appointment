"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Download,
  Loader,
  AlertCircle,
  CheckCircle,
  FileText,
  Trash2,
} from "lucide-react";
import { clsx } from "clsx";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  fileUrl: string;
  createdAt?: string;
}

export interface DocumentUploadProps {
  documents: Document[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  disabled?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_FILE_SIZE = 5; // MB

// ─── Utility Functions ───────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatDate(dateString?: string): string {
  if (!dateString) return "Unknown date";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toUpperCase() || "FILE";
}

function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  return mimeMap[ext || ""] || "application/octet-stream";
}

// ─── File Validation ────────────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateFile(
  file: File,
  acceptedTypes: string[],
  maxFileSize: number
): ValidationResult {
  // Check file type
  if (!acceptedTypes.includes(file.type)) {
    const typeList = acceptedTypes
      .map((type) => {
        if (type === "application/pdf") return "PDF";
        if (type === "image/jpeg") return "JPG";
        if (type === "image/png") return "PNG";
        return type;
      })
      .join(", ");
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${typeList}`,
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxFileSize}MB limit. Your file is ${formatFileSize(file.size)}`,
    };
  }

  return { valid: true };
}

// ─── Document List Item ─────────────────────────────────────────────────────

interface DocumentItemProps {
  document: Document;
  onDelete: (documentId: string) => Promise<void>;
  isDeleting: boolean;
}

function DocumentItem({ document, onDelete, isDeleting }: DocumentItemProps) {
  const [isHovering, setIsHovering] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this document?")) {
      await onDelete(document.id);
    }
  };

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">
            {document.title}
          </p>
          <p className="text-xs text-on-surface-variant">
            {formatDate(document.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary"
          title="Download document"
        >
          <Download className="w-4 h-4" />
        </a>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={clsx(
            "p-2 rounded-lg transition-colors",
            isDeleting
              ? "bg-error/10 text-error cursor-not-allowed"
              : "hover:bg-error/10 text-on-surface-variant hover:text-error"
          )}
          title="Delete document"
        >
          {isDeleting ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Upload Area ────────────────────────────────────────────────────────────

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  isDragging: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  isUploading: boolean;
  uploadProgress: number;
  acceptedTypes: string[];
  disabled: boolean;
}

function UploadArea({
  onFileSelect,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDrop,
  isUploading,
  uploadProgress,
  acceptedTypes,
  disabled,
}: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const acceptString = acceptedTypes.join(",");

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={clsx(
        "relative rounded-xl border-2 border-dashed transition-all p-8",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-outline-variant bg-surface-container-lowest hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        accept={acceptString}
        disabled={disabled || isUploading}
        className="hidden"
        aria-label="Upload document"
      />

      <div className="flex flex-col items-center justify-center gap-3 text-center">
        {isUploading ? (
          <>
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 text-primary/20">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <svg
                className="absolute inset-0 w-12 h-12 text-primary animate-spin"
                style={{
                  strokeDasharray: `${2 * Math.PI * 20 * (uploadProgress / 100)} ${2 * Math.PI * 20}`,
                }}
              >
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface">
                Uploading...
              </p>
              <p className="text-xs text-on-surface-variant">{uploadProgress}%</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm font-medium text-on-surface">
                Drag and drop your document here
              </p>
              <p className="text-xs text-on-surface-variant">
                or click to browse
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select File
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DocumentUpload({
  documents,
  onUpload,
  onDelete,
  maxFiles = DEFAULT_MAX_FILES,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  disabled = false,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dragCounter = useRef(0);

  const handleDragEnter = useCallback(() => {
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    []
  );

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSuccess(null);

    // Validate file
    const validation = validateFile(file, acceptedTypes, maxFileSize);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    // Check max files limit
    if (documents.length >= maxFiles) {
      setError(`Maximum ${maxFiles} documents allowed`);
      return;
    }

    // Upload file
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30;
        });
      }, 200);

      await onUpload(file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(`${file.name} uploaded successfully`);

      // Reset after a short delay
      setTimeout(() => {
        setUploadProgress(0);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload document"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId);
    setError(null);
    setSuccess(null);

    try {
      await onDelete(documentId);
      setSuccess("Document deleted successfully");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete document"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const canUploadMore = documents.length < maxFiles && !disabled;

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-error/10 border border-error/20">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <p className="text-sm text-success">{success}</p>
        </div>
      )}

      {/* Upload Area */}
      {canUploadMore && (
        <UploadArea
          onFileSelect={handleFileSelect}
          isDragging={isDragging}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          acceptedTypes={acceptedTypes}
          disabled={disabled}
        />
      )}

      {/* File Count Info */}
      {documents.length > 0 && (
        <p className="text-xs text-on-surface-variant">
          {documents.length} of {maxFiles} documents uploaded
        </p>
      )}

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-on-surface">
            Uploaded Documents
          </h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                document={doc}
                onDelete={handleDelete}
                isDeleting={deletingId === doc.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && !canUploadMore && (
        <div className="text-center py-8">
          <FileText className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">
            No documents uploaded yet
          </p>
        </div>
      )}

      {/* Max Files Reached */}
      {documents.length >= maxFiles && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-on-surface/5 border border-outline-variant">
          <AlertCircle className="w-5 h-5 text-on-surface-variant flex-shrink-0 mt-0.5" />
          <p className="text-sm text-on-surface-variant">
            Maximum {maxFiles} documents reached. Delete a document to upload
            another.
          </p>
        </div>
      )}
    </div>
  );
}
