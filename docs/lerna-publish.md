# 发布 next 版本

使用 lerna publish 命令:

--preid 指定前缀，确保版本唯一，前缀使用 $(date +%s) 生成类似 2.12.1-1640328423.0
--dist-tag 指定发布的 tag，默认是 latest
--no-push 指定不推送到远程仓库
--no-git-tag-version 不生成 git tag
--prepatch 指定发布的版本为 prepatch 版本, 只更新 patch 版本
--ignore-scripts 指定不执行脚本
--ignore-prepublish 忽略 pre-publish 脚本
