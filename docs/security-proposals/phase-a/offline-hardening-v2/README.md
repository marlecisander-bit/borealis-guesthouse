# Offline hardening proposals v2

Preparation only; no SQL executed. Original proposals/hashes remain unchanged. F01-01 adds exact RPC grantee/no-user-grant-option assertions to reject unexpected default grants, without automatically revoking them. F01-02 adds local-evidence-derived ten-key/schema/ACL/helper/role guards, installed-RPC body/security/ACL requirements, and final column/table/policy assertions. No function body or intended contraction delta is changed.

These proposals require independent PostgreSQL parsing/review and future fresh metadata; they have not been installed or rehearsed. Exact policy deparsing and source-body fingerprints intentionally fail closed on formatting/version drift. SQL cannot prove that the correct app was deployed, old sessions drained or caches are private: retain those external cutover gates. They are outside migration discovery and not an authorization package. Do not substitute these hashes for previously reviewed hashes automatically.
