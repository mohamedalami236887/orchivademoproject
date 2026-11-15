package com.orchiva.workflow.document.application;

import com.orchiva.workflow.audit.application.AuditService;
import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.common.error.ResourceNotFoundException;
import com.orchiva.workflow.document.api.DocumentModels.DocumentResponse;
import com.orchiva.workflow.document.api.DocumentModels.Download;
import com.orchiva.workflow.document.api.DocumentModels.PathInfo;
import com.orchiva.workflow.document.domain.Document;
import com.orchiva.workflow.document.domain.DocumentVersion;
import com.orchiva.workflow.document.repository.DocumentRepository;
import com.orchiva.workflow.document.repository.DocumentVersionRepository;
import com.orchiva.workflow.document.storage.DocumentStorage;
import com.orchiva.workflow.identity.application.CurrentUserService;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.request.application.RequestService;
import com.orchiva.workflow.request.domain.BusinessRequest;
import com.orchiva.workflow.request.domain.RequestStatus;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class DocumentService {
    private static final Set<String> ALLOWED_TYPES = Set.of("application/pdf", "image/png", "image/jpeg",
            "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private final DocumentRepository documents;
    private final DocumentVersionRepository versions;
    private final DocumentStorage storage;
    private final RequestService requests;
    private final CurrentUserService currentUsers;
    private final AuditService audit;

    public DocumentService(DocumentRepository documents, DocumentVersionRepository versions, DocumentStorage storage,
                           RequestService requests, CurrentUserService currentUsers, AuditService audit) {
        this.documents = documents; this.versions = versions; this.storage = storage;
        this.requests = requests; this.currentUsers = currentUsers; this.audit = audit;
    }

    public DocumentResponse create(UUID requestId, String title, MultipartFile file) throws IOException {
        BusinessRequest request = requests.requireRequest(requestId);
        UserAccount actor = currentUsers.requireCurrentUser();
        requireOwnerAndEditable(request, actor);
        Document document = documents.save(new Document(request, normalizeTitle(title), actor));
        addStoredVersion(document, file, actor);
        audit.record(actor, "DOCUMENT_CREATED", "DOCUMENT", document.getId(), Map.of("requestId", requestId));
        return DocumentResponse.from(document);
    }

    public DocumentResponse addVersion(UUID documentId, MultipartFile file) throws IOException {
        Document document = requireDocument(documentId);
        UserAccount actor = currentUsers.requireCurrentUser();
        requireOwnerAndEditable(document.getRequest(), actor);
        addStoredVersion(document, file, actor);
        audit.record(actor, "DOCUMENT_VERSION_ADDED", "DOCUMENT", document.getId(),
                Map.of("version", document.getLatestVersionNumber()));
        return DocumentResponse.from(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listForRequest(UUID requestId) {
        BusinessRequest request = requests.requireRequest(requestId);
        requests.requireView(request, currentUsers.requireCurrentUser());
        return documents.findAllByRequestIdOrderByUpdatedAtDesc(requestId).stream().map(DocumentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> search(String query) {
        UserAccount actor = currentUsers.requireCurrentUser();
        return documents.findByTitleContainingIgnoreCaseOrderByUpdatedAtDesc(query == null ? "" : query.trim()).stream()
                .filter(document -> canView(document.getRequest(), actor)).map(DocumentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Download download(UUID documentId, Integer versionNumber) {
        Document document = requireDocument(documentId);
        requests.requireView(document.getRequest(), currentUsers.requireCurrentUser());
        int requested = versionNumber == null ? document.getLatestVersionNumber() : versionNumber;
        DocumentVersion version = versions.findByDocumentIdAndVersionNumber(documentId, requested)
                .orElseThrow(() -> new ResourceNotFoundException("Document version not found."));
        Path path = storage.resolve(version.getStoredFilename());
        return new Download(new PathInfo(path), version.getOriginalFilename(), version.getContentType(), version.getSizeBytes());
    }

    private void addStoredVersion(Document document, MultipartFile file, UserAccount actor) throws IOException {
        validate(file);
        String original = safeOriginalName(file.getOriginalFilename());
        String extension = extension(original);
        DocumentStorage.StoredFile stored = storage.store(file.getInputStream(), extension);
        document.addVersion(original, stored.name(), file.getContentType(), stored.size(), stored.sha256(), actor);
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BusinessRuleException("A non-empty file is required.");
        if (file.getContentType() == null || !ALLOWED_TYPES.contains(file.getContentType().toLowerCase(Locale.ROOT))) {
            throw new BusinessRuleException("File type is not allowed.");
        }
    }

    private void requireOwnerAndEditable(BusinessRequest request, UserAccount actor) {
        boolean admin = actor.getRoles().stream().anyMatch(role -> role.getName() == RoleName.ADMIN);
        if (!request.getCreator().getId().equals(actor.getId()) && !admin) throw new AccessDeniedException("Only the request owner can upload documents.");
        if (request.getStatus() == RequestStatus.APPROVED || request.getStatus() == RequestStatus.REJECTED
                || request.getStatus() == RequestStatus.CANCELLED) {
            throw new BusinessRuleException("Documents cannot be changed after the request is complete.");
        }
    }

    private boolean canView(BusinessRequest request, UserAccount actor) {
        try { requests.requireView(request, actor); return true; }
        catch (AccessDeniedException exception) { return false; }
    }

    private Document requireDocument(UUID id) {
        return documents.findById(id).orElseThrow(() -> new ResourceNotFoundException("Document not found."));
    }
    private String normalizeTitle(String title) {
        if (title == null || title.isBlank() || title.length() > 180) throw new BusinessRuleException("Document title is required and must not exceed 180 characters.");
        return title.trim();
    }
    private String safeOriginalName(String name) {
        String safe = name == null ? "document" : Path.of(name).getFileName().toString();
        return safe.length() > 255 ? safe.substring(safe.length() - 255) : safe;
    }
    private String extension(String name) {
        int index = name.lastIndexOf('.');
        if (index < 0) return "";
        String value = name.substring(index).toLowerCase(Locale.ROOT);
        return value.length() <= 12 && value.matches("\\.[a-z0-9]+") ? value : "";
    }
}
