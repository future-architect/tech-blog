@if "%~1"=="" (
    echo "引数無し"
) else (
    snssharecount > temp.json
    move temp.json sns_count_cache.json

    git add .
    git commit -m "%~1"
    git push origin HEAD
    hexo g
    cd public
    git add .
    git commit -m "%~1"
    git push origin HEAD
    cd ../
)
