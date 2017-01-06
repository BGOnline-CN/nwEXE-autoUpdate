/*
    nw.js桌面程序自动更新module for angular
    Author: BGONLINE
    2016-12-29
*/
(function(angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define('bgo-update', ['angular'], function(angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(typeof angular === 'undefined' ? null : angular, function(angular) {

var module = angular.module('bgoUpdate', []);

'use strict';

module

    .factory('bgoAutoUpdate', ['$http', '$q', '$interval', '$timeout', function($http, $q, $interval, $timeout) {
        var version = {
            localVer: '',
            remoteVer: ''
        }
          
        var fs = require('fs');
        var path = require('path');
        var request = require('request');
        var child_process = require('child_process');
        var nwPath = process.execPath;
        var nwDir = path.dirname(nwPath);
        var file = path.join(nwDir, 'current.exe');
        return {
            normal: function() {
                var str = '';
                var interval = $interval(function() {
                    str += '.';
                    angular.element('#progress > span').html(str);
                    if(str.length > 3) {
                        win.hide()
                        child_process.exec(file, function(err, stdout, stderr) {
                            process.exit(0);
                            $interval.cancel(interval);
                        });
                    }
                }, 1000)
            },
            
            compareVer: function(RequestUrl) {
                var remoteURL  = RequestUrl;
                var deferred = $q.defer();
                fs.readFile(path.join(nwDir, 'version.txt'), function(err, data) { 
                    if(err) {
                        fs.writeFile(path.join(nwDir, 'version.txt'), '0.0.1', function(err) {
                            if(err) throw err;
                        });
                        layer.alert("系统检测到重要文件丢失，请手动重启应用！", {closeBtn: 0, icon: 5, shade: 0}, function() {
                            layer.closeAll();
                            process.exit(0);
                        });
                    }else {
                        version.localVer = data;
                        $http.get(remoteURL).success(function(items) {
                            if(items.code == 200) {
                                version.remoteVer = items.data.version;
                                var isUpdate = version.localVer && version.remoteVer && version.localVer != version.remoteVer ? true : false;
                                items.isUpdate = isUpdate;
                                if(isUpdate) {
                                    fs.writeFile(path.join(nwDir, 'version.txt'), version.remoteVer, function(err) {
                                        if(err) throw err;
                                    });
                                }
                                deferred.resolve(items);
                            }
                        }).error(function(data, status, headers, config) {
                            layer.msg("程序初始化失败，请检查网络连接！", function() {});
                        });
                    }
                    
                });
                return deferred.promise;
            },

            update: function(DownloadUrl, total) {
                request(DownloadUrl, function (error, response) {
                    if(!error && response.statusCode == 200) {
                        angular.element('.title').html('升级完成');
                        angular.element('#progress > span').html('100');
                        $interval.cancel(timer);

                        var t = 3;
                        var interval = $interval(function() {
                            angular.element('.title').html('自动重启');
                            angular.element('#progress').html('<span style="font-size: 5em;">'+ t-- +'</span>');
                            if(t < 0) {
                                win.hide()
                                angular.element('.title').html('学籍系统保护模块');
                                angular.element('#progress > span').html('请勿关闭！');
                                child_process.exec(file, function(err, stdout, stderr) {
                                    process.exit(0);
                                });
                                $interval.cancel(interval);
                            }
                        }, 1000)
                    }
                }).pipe(fs.createWriteStream(file));

                var timer = $interval(function() {
                    var loaded = fs.statSync(file).size;
            　　　　 var percentComplete = loaded / total;
                    var downloadProgress = (percentComplete * 100).toFixed(1);
                    angular.element('#progress > span').html(downloadProgress);
                }, 100);
                return;
            }
        }
    }])

    return module;
}));