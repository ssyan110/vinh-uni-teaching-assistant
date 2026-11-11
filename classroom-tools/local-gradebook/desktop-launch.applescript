on run
    try
        do shell script "/opt/homebrew/opt/python@3.14/bin/python3.14 '/Users/ssyan110/Development/vinh-uni-teaching-assistant/classroom-tools/local-gradebook/launch.py' --desktop"
    on error errorMessage
        display alert "教师评分无法启动" message errorMessage as critical
    end try
end run
