package com.orchiva.workflow.document.api;

import com.orchiva.workflow.document.api.DocumentModels.DocumentResponse;
import com.orchiva.workflow.document.application.DocumentService;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class DocumentController {
    private final DocumentService service;
    public DocumentController(DocumentService service) { this.service = service; }

    @PostMapping(path = "/api/requests/{requestId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    DocumentResponse create(@PathVariable UUID requestId, @RequestParam String title,
                            @RequestPart("file") MultipartFile file) throws IOException {
        return service.create(requestId, title, file);
    }

    @GetMapping("/api/requests/{requestId}/documents")
    List<DocumentResponse> list(@PathVariable UUID requestId) { return service.listForRequest(requestId); }

    @GetMapping("/api/documents")
    List<DocumentResponse> search(@RequestParam(defaultValue = "") String query) { return service.search(query); }

    @PostMapping(path = "/api/documents/{id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    DocumentResponse addVersion(@PathVariable UUID id, @RequestPart("file") MultipartFile file) throws IOException {
        return service.addVersion(id, file);
    }

    @GetMapping("/api/documents/{id}/content")
    ResponseEntity<FileSystemResource> download(@PathVariable UUID id,
                                                @RequestParam(required = false) Integer version,
                                                @RequestParam(defaultValue = "false") boolean preview) {
        var download = service.download(id, version);
        boolean safePreview = preview && isSafePreview(download.contentType());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .contentLength(download.size())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        (safePreview ? ContentDisposition.inline() : ContentDisposition.attachment())
                                .filename(download.filename()).build().toString())
                .body(new FileSystemResource(download.path().value()));
    }

    private boolean isSafePreview(String contentType) {
        return contentType.equals(MediaType.APPLICATION_PDF_VALUE)
                || contentType.equals(MediaType.IMAGE_PNG_VALUE)
                || contentType.equals(MediaType.IMAGE_JPEG_VALUE)
                || contentType.equals(MediaType.TEXT_PLAIN_VALUE);
    }
}
