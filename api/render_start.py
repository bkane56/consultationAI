import os

import uvicorn


def main() -> None:
    port = int(os.environ.get("PORT", "10000"))

    uvicorn.run(
        "api.server:app",
        host="0.0.0.0",
        port=port,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )


if __name__ == "__main__":
    main()
