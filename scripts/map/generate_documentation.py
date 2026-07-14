"""Generate the exhaustive Phase Six province reconstruction register."""

from __future__ import annotations

from _common import (
    ROOT,
    RULES_PATH,
    administrative_periods,
    geographic_valid_from,
    geographic_valid_until,
    read_json,
)


def clean(value: object) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def main() -> None:
    payload = read_json(RULES_PATH)
    rows = []
    for rule in payload["rules"]:
        validity = clean(geographic_valid_from(rule))
        if geographic_valid_until(rule):
            validity += f" to {clean(geographic_valid_until(rule))}"
        inputs = ", ".join(rule["inputFeatureIds"])
        sources = ", ".join(rule["sourceIds"])
        periods = administrative_periods(rule)
        governments = "; ".join(
            f"{period['validFrom']} {period['formalGovernmentId']} ({period['administrativeType']})"
            for period in periods
        )
        rows.append(
            "| {name} | `{pid}` | {operation} | {inputs} | `{government}` | "
            "`{strategic}` | {validity} | {confidence} | {sources} | {notes} |".format(
                name=clean(rule["name1921"]),
                pid=clean(rule["outputProvinceId"]),
                operation=clean(rule["operation"]),
                inputs=clean(inputs),
                government=clean(governments),
                strategic=clean(rule["strategicRegionId"]),
                validity=validity,
                confidence=clean(rule["confidence"]),
                sources=clean(sources),
                notes=clean(rule["notes"]),
            )
        )
    document = """# Province Reconstruction Register, March 1921

This generated register documents every rule in `packages/content/map-data/province-changes-1921.json`. Source features prefixed `province:` and `district:` are real IISH/RiStat 1897 vector IDs. Operations are deterministic dissolves, splits, transfers, renames, retentions, or external-unit constructions; coordinate bounds are never inputs.

The browser bundle contains three shared-topology simplifications: overview (`provinces-1921.topo.json`), medium theater (`provinces-1921.medium.topo.json`), and detailed local (`provinces-1921.detail.topo.json`). District detail is separately exported at medium and detailed levels. Date filtering is inclusive and month-sliced in production.

| Province | Stable ID | Operation | Original source features | Formal government | Strategic parent | Validity | Confidence | Sources | Known uncertainty / reconstruction note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
""" + "\n".join(rows) + "\n"
    destination = ROOT / "docs" / "PROVINCE_RECONSTRUCTION_1921.md"
    destination.write_text(document, encoding="utf-8", newline="\n")
    print(f"documented {len(rows)} province rules in {destination}")


if __name__ == "__main__":
    main()
