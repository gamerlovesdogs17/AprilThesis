"""Download and checksum the public IISH/RiStat 1897 GIS foundation."""

from __future__ import annotations

import hashlib
import urllib.error
import urllib.parse
import urllib.request

from _common import (
    DISTRICTS_SOURCE,
    MOSKVA_RIVER_SOURCE,
    PROVINCES_SOURCE,
    RIVERS_SOURCE,
    ensure_directories,
)

SOURCES = (
    (
        "https://datasets.iisg.amsterdam/api/access/datafile/10335",
        PROVINCES_SOURCE,
        "db5cea09836b4971da087e711bff9587",
        "md5",
    ),
    (
        "https://datasets.iisg.amsterdam/api/access/datafile/10336",
        DISTRICTS_SOURCE,
        "c4aa427798360f0b4b3d9818a7c5654f",
        "md5",
    ),
    (
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson",
        RIVERS_SOURCE,
        "f286e0ce978fde999ca2d7a78c764be08542e19b63cded52b05c12d5173ccc51",
        "sha256",
    ),
)

POST_SOURCES = (
    (
        "https://overpass-api.de/api/interpreter",
        (
            '[out:json][timeout:90][date:"2026-07-13T22:19:45Z"];'
            'relation(389341);way(r);out geom;'
        ),
        MOSKVA_RIVER_SOURCE,
        "423ce5d198a75361827eb66c7ecf5db5d766020c6efeb79a07a5e886f8112e69",
        "sha256",
    ),
)


def checksum(path, algorithm: str) -> str:
    digest = hashlib.new(algorithm, usedforsecurity=False)
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    ensure_directories()
    for url, destination, expected, algorithm in SOURCES:
        if destination.exists() and checksum(destination, algorithm) == expected:
            print(f"cached and verified: {destination.name}")
            continue
        temporary = destination.with_suffix(destination.suffix + ".part")
        try:
            with urllib.request.urlopen(url, timeout=90) as response:
                temporary.write_bytes(response.read())
        except (urllib.error.URLError, TimeoutError) as error:
            raise SystemExit(
                f"Unable to download {url}: {error}\n"
                "No fallback geometry was generated. Restore network access or place the "
                f"published file at {destination}."
            ) from error
        actual = checksum(temporary, algorithm)
        if actual != expected:
            temporary.unlink(missing_ok=True)
            raise SystemExit(
                f"Checksum mismatch for {destination.name}: expected {expected}, got {actual}"
            )
        temporary.replace(destination)
        print(f"downloaded and verified: {destination.name}")

    for url, query, destination, expected, algorithm in POST_SOURCES:
        if destination.exists() and checksum(destination, algorithm) == expected:
            print(f"cached and verified: {destination.name}")
            continue
        temporary = destination.with_suffix(destination.suffix + ".part")
        request = urllib.request.Request(
            url,
            data=urllib.parse.urlencode({"data": query}).encode("utf-8"),
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "AprilThesisMapBuild/0.6",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                temporary.write_bytes(response.read())
        except (urllib.error.URLError, TimeoutError) as error:
            raise SystemExit(
                f"Unable to download {url}: {error}\n"
                "No fallback river geometry was generated. Restore network access or "
                f"place the dated OpenStreetMap extract at {destination}."
            ) from error
        actual = checksum(temporary, algorithm)
        if actual != expected:
            temporary.unlink(missing_ok=True)
            raise SystemExit(
                f"Checksum mismatch for {destination.name}: expected {expected}, got {actual}"
            )
        temporary.replace(destination)
        print(f"downloaded and verified: {destination.name}")


if __name__ == "__main__":
    main()
