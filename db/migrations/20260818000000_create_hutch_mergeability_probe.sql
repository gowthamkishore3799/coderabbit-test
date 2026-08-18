-- Hutch E2E fixture: this test migration must never be deployed.
-- Retry marker: validates the corrected Hutch JSON policy environment.
CREATE TABLE hutch_mergeability_probe (
    id BIGSERIAL PRIMARY KEY,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
