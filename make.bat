@if "%~1"=="" (
    echo "引数無し"
) else (
    git add .
    git commit -m "%~1"
    git push origin HEAD
    hexo g
    cd public
    git add .
    git commit -m "%~1"
    git push origin HEAD
)
