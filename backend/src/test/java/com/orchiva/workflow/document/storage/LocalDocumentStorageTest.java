package com.orchiva.workflow.document.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalDocumentStorageTest {
    @TempDir Path directory;

    @Test
    void storesContentUnderGeneratedNameWithDigest() throws Exception {
        LocalDocumentStorage storage = new LocalDocumentStorage(directory.toString());
        var result = storage.store(new ByteArrayInputStream("evidence".getBytes(StandardCharsets.UTF_8)), ".txt");
        assertThat(result.name()).endsWith(".txt");
        assertThat(result.size()).isEqualTo(8);
        assertThat(result.sha256()).hasSize(64);
        assertThat(storage.resolve(result.name())).startsWith(directory);
    }

    @Test
    void rejectsPathTraversalKeys() {
        LocalDocumentStorage storage = new LocalDocumentStorage(directory.toString());
        assertThatThrownBy(() -> storage.resolve("../secret.txt")).isInstanceOf(IllegalArgumentException.class);
    }
}
