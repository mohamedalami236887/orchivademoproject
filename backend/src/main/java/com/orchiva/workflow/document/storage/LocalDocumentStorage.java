package com.orchiva.workflow.document.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LocalDocumentStorage implements DocumentStorage {
    private final Path root;
    public LocalDocumentStorage(@Value("${orchiva.document-storage}") String location) {
        this.root = Path.of(location).toAbsolutePath().normalize();
    }

    @Override
    public StoredFile store(InputStream input, String extension) throws IOException {
        Files.createDirectories(root);
        String name = UUID.randomUUID() + extension;
        Path target = safe(name);
        Path temporary = safe(name + ".uploading");
        MessageDigest digest;
        try { digest = MessageDigest.getInstance("SHA-256"); }
        catch (NoSuchAlgorithmException exception) { throw new IllegalStateException("SHA-256 unavailable", exception); }
        try (DigestInputStream digested = new DigestInputStream(input, digest)) {
            Files.copy(digested, temporary, StandardCopyOption.REPLACE_EXISTING);
        }
        Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE);
        return new StoredFile(name, Files.size(target), HexFormat.of().formatHex(digest.digest()));
    }

    @Override
    public Path resolve(String storedFilename) {
        Path path = safe(storedFilename);
        if (!Files.isRegularFile(path)) throw new com.orchiva.workflow.common.error.ResourceNotFoundException("Document content not found.");
        return path;
    }

    private Path safe(String name) {
        Path path = root.resolve(name).normalize();
        if (!path.startsWith(root) || name.contains("/") || name.contains("\\")) {
            throw new IllegalArgumentException("Invalid storage key.");
        }
        return path;
    }
}
