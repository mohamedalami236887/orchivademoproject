package com.orchiva.workflow.document.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;

public interface DocumentStorage {
    StoredFile store(InputStream input, String extension) throws IOException;
    Path resolve(String storedFilename);
    record StoredFile(String name, long size, String sha256) {}
}
