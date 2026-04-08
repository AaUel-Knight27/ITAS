package com.aauelknight.itas_backend.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;

public final class SlugGenerator {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9]+");
    private static final Pattern EDGE_HYPHENS = Pattern.compile("(^-+|-+$)");
    private static final String FALLBACK_BASE = "course";
    private static final char[] SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789".toCharArray();
    private static final int DEFAULT_SUFFIX_LENGTH = 5;

    private SlugGenerator() {
    }

    public static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD);
        normalized = DIACRITICS.matcher(normalized).replaceAll("");
        normalized = normalized.toLowerCase(Locale.ROOT).trim();
        normalized = NON_ALPHANUMERIC.matcher(normalized).replaceAll("-");

        return EDGE_HYPHENS.matcher(normalized).replaceAll("");
    }

    public static String fallbackBase(String value) {
        String normalized = normalize(value);
        return normalized.isBlank() ? FALLBACK_BASE : normalized;
    }

    public static String appendRandomSuffix(String base) {
        String safeBase = fallbackBase(base);
        return safeBase + "-" + randomSuffix(DEFAULT_SUFFIX_LENGTH);
    }

    private static String randomSuffix(int length) {
        StringBuilder suffix = new StringBuilder(length);
        ThreadLocalRandom random = ThreadLocalRandom.current();

        for (int index = 0; index < length; index++) {
            suffix.append(SUFFIX_ALPHABET[random.nextInt(SUFFIX_ALPHABET.length)]);
        }

        return suffix.toString();
    }
}

