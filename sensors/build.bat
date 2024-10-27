set "VC_BIN=C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\bin"
call "%VC_BIN%\vcvars32"

cl /I "tofsdk\include" /I "ndi\include" /EHsc /MD "tofsdk\lib\tof.lib" ndi\lib\win_x86\Processing.NDI.Lib.x86.lib kernel32.lib user32.lib gdi32.lib advapi32.lib tof2ndi.cpp  

rem .\tof2ndi.exe